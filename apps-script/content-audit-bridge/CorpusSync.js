/**
 * ================================================================
 * Content Audit — Corpus Sync  (Piece 1 of 2: the Drive→Sheet sync)
 * v1.5.1
 * ================================================================
 * Reads the HC + KA Google Docs and caches them into ONE Google Sheet.
 * NO AI, NO API key for Gemini — just Drive reads + Sheet writes.
 * (v1.5.x adds ONE outbound call to the Contentful Delivery API to
 *  fetch the language-agnostic article name; see below.)
 *
 * v1.5.1 changes (hardening, no change to how your data is written):
 *   - The Contentful query is now identical to the URL verified working
 *     in the browser (content_type + fields.slug + access_token only).
 *     No &select / &include — fields.name is always at items[0].fields.name,
 *     so we keep the exact request shape we trust.
 *   - fetchContentfulNameBySlug_ retries ONCE on a transient failure
 *     (HTTP 429 or 5xx, or a network error) with a short backoff, so the
 *     backfill finishes in fewer passes. A 200-with-no-match or a hard
 *     4xx returns immediately (no pointless retry).
 *
 * v1.5.0 changes (translation pairing key):
 *   - NEW COLUMN 'translationKey' is added at the END of the schema
 *     (after fullText), so NO existing column shifts and NO existing
 *     data moves. translationKey is also added to PRESERVED_COLUMNS,
 *     so once it is filled the nightly sync never wipes it.
 *   - For HC docs, the sync reads the "Slug: ..." line from the doc's
 *     header, calls the Contentful Delivery API for that slug, takes
 *     fields.name (e.g. "How to ask for reviews [Spanish]"), strips the
 *     trailing language tag in [brackets], lowercases it, and stores
 *     that as translationKey (e.g. "how to ask for reviews"). An EN
 *     article and its ES/PT translations share the SAME name base, so
 *     they get the SAME translationKey — this is the reliable 1-to-1
 *     pairing the app needs (topicId was too coarse: many EN docs share
 *     one topicId, which caused wrong ES/PT siblings to appear).
 *   - Contentful is only called when a doc is HC AND its translationKey
 *     is still empty, so after the first backfill the nightly sync makes
 *     almost no Contentful calls. KA docs are never called (not in
 *     Contentful) and keep an empty translationKey.
 *   - Failures are visible, not silent: if Contentful is unreachable or
 *     the slug is missing, translationKey is left empty and a note is
 *     logged; the next run retries. Nothing else in the row is affected.
 *   - NEW one-time function backfillTranslationKeyOnce() fills the key
 *     for all existing HC rows in batches with progress logging.
 *
 * v1.4.0 changes:
 *   - SAFETY FIX: the nightly sync no longer wipes seeded / AI-enriched
 *     columns. PRESERVED_COLUMNS (topicId, topicRole, summary, concepts,
 *     aliases) are carried over when an existing doc's row is rewritten.
 *   - lifecycle + kaSubject are now computed deterministically from the
 *     title on every sync (so new docs get them automatically), and a
 *     one-time applyLifecycleAndSubjectOnce() backfills the existing rows.
 *
 * v1.3.0 changes:
 *   - COLUMNS extended with the enrichment fields used by the search:
 *     topicId, topicRole, lifecycle, kaSubject, summary, concepts, aliases.
 *   - migrateColumns(): one-time, rewrites the header row of the corpus
 *     Sheet to include the new columns (does NOT touch any data).
 *   - applySeedOnce(): one-time, copies topicId + topicRole from the
 *     'topics_seed' tab into the corpus rows, matching on docId.
 *
 * v1.2.0 changes:
 *   - KA audiences updated: Sales was renamed to GTM. The parser now
 *     recognizes GTM (and still maps any old "Sales" filename to GTM
 *     so legacy names don't fall through).
 *   - collectDocs_ now also resolves Drive SHORTCUTS that point to
 *     Google Docs, and counts every file it skips by mime type.
 *   - New diagnostic auditFolders().
 *
 * v1.1.0 changes:
 *   - parseFileName_ recognizes KA internal audiences.
 *   - One-time fixMetadataOnce().
 *
 * One-time setup (run in this order):
 *   1) setupSheet()            -> creates the cache Sheet
 *   2) startInitialLoad()      -> fills it with all ~660 docs (self-chains)
 *   3) installNightlyTrigger() -> turns on the nightly auto-refresh
 *
 * ENRICHMENT setup (one-time, run in this order AFTER the seed is in place):
 *   A) Import topics_seed.csv into a tab named 'topics_seed'
 *   B) migrateColumns()        -> adds the new header columns
 *   C) applySeedOnce()         -> writes topicId + topicRole from the seed
 *
 * TRANSLATION KEY setup (one-time, v1.5.0):
 *   1) migrateColumns()              -> adds the 'translationKey' header (data untouched)
 *   2) backfillTranslationKeyOnce()  -> fills translationKey for existing HC rows
 *      (re-run it until it reports 0 pending; it resumes where it left off)
 *
 * After that it runs itself: every night it refreshes only the docs
 * that changed (compares each doc's lastUpdated against the Sheet).
 * ================================================================
 */

// ====== CONFIG (the folders this reads — never writes to them) ======
var HC_FOLDER_ID = '1Eh0jaXmPFWx-YjntLh73xxdWni32IeqP';   // Help Center
var KA_FOLDER_ID = '1y-wucQGJ2i0y3VSfr1Hv4v-AK5GcNNQf';   // Knowledge Articles (Shared Drive)

// The corpus Sheet (used by applySeedOnce to find the topics_seed tab).
var CORPUS_SHEET_ID_LITERAL = '16X-I4oT-W96XTwx1qs7ErqTAT6sJI7du3_vnYFp9MIo';

// ====== CONTENTFUL (Delivery API — read-only, public token) ======
// Used ONLY to fetch the language-agnostic article name for HC docs.
var CONTENTFUL_SPACE = 'zkjkphkd3oqx';
var CONTENTFUL_ENV = 'master';
var CONTENTFUL_TOKEN = 'wYRv1oJP9HTiR8n_YD_qcdIrJBCPv1bBkOIscTmOSWE';
var CONTENTFUL_CT = 'helpCenterArticle';

// Soft cap of docs per run; the real guard is the time budget below.
var BATCH_SIZE = 50;
var MAX_RUNTIME_MS = 4.5 * 60 * 1000;   // stop at 4.5 min, reschedule

// Google Sheets cell hard limit is 50,000 chars; keep a safety margin.
var MAX_CELL_CHARS = 48000;

// The Sheet columns, in order. fullText stays second-to-last; translationKey
// is appended LAST (v1.5.0) so NO existing column position changes.
var COLUMNS = [
  'docId', 'title', 'url', 'fileName', 'lane', 'audience', 'language',
  'internalAudience', 'headings', 'wordCount', 'lastUpdated', 'lastSynced',
  'status', 'topicId', 'topicRole', 'lifecycle', 'kaSubject',
  'summary', 'concepts', 'aliases', 'fullText', 'translationKey'
];

// Columns that come from the SEED / GEMINI / CONTENTFUL and must NOT be
// recomputed-to-blank by the sync. When an existing doc's row is rewritten,
// these are read from the current row and carried over, so a re-sync never
// wipes them.
// NOTE: lifecycle + kaSubject are intentionally NOT here — they are
// deterministic from the title and safe to recompute on every sync.
var PRESERVED_COLUMNS = ['topicId', 'topicRole', 'summary', 'concepts', 'aliases', 'translationKey'];

var P = {
  SHEET_ID:    'CORPUS_SHEET_ID',
  INIT_CURSOR: 'INIT_LOAD_CURSOR',
  TKEY_CURSOR: 'TKEY_BACKFILL_CURSOR'
};


/* ================================================================
 * STEP 1 — One-time: create the cache Sheet
 * ================================================================ */
function setupSheet() {
  var ss = SpreadsheetApp.create('Content Audit — Corpus Cache');
  var sh = ss.getActiveSheet();
  sh.setName('corpus');
  sh.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
  sh.setFrozenRows(1);
  PropertiesService.getScriptProperties().setProperty(P.SHEET_ID, ss.getId());
  Logger.log('Cache Sheet created:\n' + ss.getUrl());
}


/* ================================================================
 * STEP 2 — One-time: initial load of all ~660 docs.
 * Self-chains until done.
 * ================================================================ */
function startInitialLoad() {
  PropertiesService.getScriptProperties().deleteProperty(P.INIT_CURSOR);
  runInitialLoadBatch();
}

function runInitialLoadBatch() {
  var startTime = Date.now();
  var sheet = getSheet_();
  var allFiles = listAllDocs_();
  var cursor = Number(getProp_(P.INIT_CURSOR, '0'));
  var processed = 0;

  for (var i = cursor; i < allFiles.length && processed < BATCH_SIZE; i++) {
    if (Date.now() - startTime > MAX_RUNTIME_MS) break;   // time guard
    var entry = allFiles[i];
    try {
      writeDoc_(entry.file, entry.folder, sheet);
    } catch (err) {
      upsertError_(sheet, entry.file, entry.folder, String(err));
    }
    processed++;
  }

  var nextCursor = cursor + processed;
  PropertiesService.getScriptProperties().setProperty(P.INIT_CURSOR, String(nextCursor));

  if (nextCursor < allFiles.length) {
    scheduleChainContinuation_();
    Logger.log('Initial load: ' + nextCursor + ' / ' + allFiles.length + ' done. Continuing...');
  } else {
    cleanupChainTriggers_();
    PropertiesService.getScriptProperties().deleteProperty(P.INIT_CURSOR);
    Logger.log('Initial load COMPLETE. Total docs: ' + allFiles.length);
  }
}


/* ================================================================
 * STEP 3 — One-time: install the nightly auto-refresh trigger
 * ================================================================ */
function installNightlyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'nightlySync') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('nightlySync')
    .timeBased()
    .everyDays(1)
    .atHour(5)            // ~5 AM in the script's timezone
    .create();
  Logger.log('Nightly refresh trigger installed (~5 AM daily).');
}


/* ================================================================
 * THE NIGHTLY SYNC — refresh only the docs that changed.
 * ================================================================ */
function nightlySync() {
  var startTime = Date.now();
  var sheet = getSheet_();
  var known = loadExisting_(sheet);     // { docId: {rowIndex, lastUpdated} }
  var allFiles = listAllDocs_();

  var toWrite = [];
  var seen = {};

  allFiles.forEach(function (entry) {
    var id = entry.file.getId();
    seen[id] = true;
    var updated = entry.file.getLastUpdated().getTime();
    var prev = known[id];
    if (!prev || Number(prev.lastUpdated) !== updated) {
      toWrite.push(entry);              // new or changed
    }
  });

  var written = 0, errors = 0, skipped = 0;
  for (var k = 0; k < toWrite.length; k++) {
    if (Date.now() - startTime > MAX_RUNTIME_MS) { skipped = toWrite.length - k; break; }
    var entry = toWrite[k];
    try {
      writeDoc_(entry.file, entry.folder, sheet);
      written++;
    } catch (err) {
      errors++;
      upsertError_(sheet, entry.file, entry.folder, String(err));
    }
  }

  // Remove rows for docs that no longer exist in either folder.
  var removeIndices = [];
  Object.keys(known).forEach(function (id) {
    if (!seen[id]) removeIndices.push(known[id].rowIndex);
  });
  removeIndices.sort(function (a, b) { return b - a; });
  removeIndices.forEach(function (idx) { removeRow_(sheet, idx); });
  var removed = removeIndices.length;

  Logger.log('Nightly sync — written: ' + written + ', removed: ' + removed +
             ', skipped (retry next run): ' + skipped + ', errors: ' + errors);
}


/* ================================================================
 * ENRICHMENT — STEP B (one-time): migrate the header row.
 * Rewrites row 1 of the corpus Sheet with the current COLUMNS list,
 * so the new columns appear. Does NOT touch any data row. Safe to
 * run more than once. (v1.5.0: this now also adds 'translationKey'
 * as a new empty header column at the end.)
 * ================================================================ */
function migrateColumns() {
  var sheet = getSheet_();
  sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
  Logger.log('Headers migrated. Corpus now has ' + COLUMNS.length + ' columns:\n' + COLUMNS.join(', '));
}


/* ================================================================
 * ENRICHMENT — STEP C (one-time): apply the topic seed.
 * Reads the 'topics_seed' tab and writes topicId + topicRole into
 * the matching corpus row (matched by docId). Run once.
 * ================================================================ */
function applySeedOnce() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var seed = ss.getSheetByName('topics_seed');
  if (!seed) throw new Error('No encuentro la hoja topics_seed. Revisa el nombre exacto.');

  // Read the seed: docId -> {topicId, topicRole}
  var sData = seed.getDataRange().getValues();
  var sHdr = sData[0];
  var cDoc  = sHdr.indexOf('docId');
  var cTid  = sHdr.indexOf('topicId');
  var cRole = sHdr.indexOf('topicRole');
  if (cDoc < 0 || cTid < 0 || cRole < 0) {
    throw new Error('Headers del seed no encontrados (docId / topicId / topicRole).');
  }

  var seedMap = {};
  for (var i = 1; i < sData.length; i++) {
    var id = String(sData[i][cDoc] || '').trim();
    if (id) seedMap[id] = { topicId: sData[i][cTid], topicRole: sData[i][cRole] };
  }

  // Write into the corpus
  var corpus = getSheet_();
  var idCol   = COLUMNS.indexOf('docId') + 1;
  var tidCol  = COLUMNS.indexOf('topicId') + 1;
  var roleCol = COLUMNS.indexOf('topicRole') + 1;
  var lastRow = corpus.getLastRow();
  var n = lastRow - 1;
  if (n < 1) { Logger.log('Corpus vacío, nada que aplicar.'); return; }

  var ids = corpus.getRange(2, idCol, n, 1).getValues();

  var tidOut = [], roleOut = [];
  var matched = 0, missing = 0;
  for (var r = 0; r < n; r++) {
    var id = String(ids[r][0] || '').trim();
    var s = seedMap[id];
    if (s) { tidOut.push([s.topicId]); roleOut.push([s.topicRole]); matched++; }
    else   { tidOut.push(['']);        roleOut.push(['']);          missing++; }
  }

  corpus.getRange(2, tidCol,  n, 1).setValues(tidOut);
  corpus.getRange(2, roleCol, n, 1).setValues(roleOut);
  Logger.log('Seed applied. Matched: ' + matched + ', not in seed: ' + missing + ', total rows: ' + n);
}


/* ================================================================
 * TRANSLATION KEY — helpers (v1.5.0)
 * ================================================================ */

// Read the "Slug: ..." line out of a Google Doc's HEADER (the gray metadata
// block lives in the real page header, not the body). Returns '' if not found.
function extractSlugFromDoc_(doc) {
  try {
    var header = doc.getHeader();
    if (!header) return '';
    var text = header.getText() || '';
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      // Match a line like "Slug: politica-de-contenido-y-resenas"
      var m = lines[i].match(/^\s*slug\s*:\s*(\S+)\s*$/i);
      if (m) return m[1].trim();
    }
  } catch (e) { /* no header / not accessible */ }
  return '';
}

// Turn a Contentful 'name' into the language-agnostic pairing key.
// "How to ask for reviews [Spanish]" -> "how to ask for reviews"
// "Refund policy for pros"           -> "refund policy for pros"
function translationKeyFromName_(name) {
  if (!name) return '';
  // Strip a single trailing [bracketed] language tag, then lowercase + trim.
  var base = String(name).replace(/\s*\[[^\]]*\]\s*$/, '').trim();
  return base.toLowerCase();
}

// Fetch the Contentful article 'name' for a given slug. Read-only Delivery API.
// Returns '' (and logs) on any failure — caller decides what to do.
function fetchContentfulNameBySlug_(slug) {
  if (!slug) return '';
  // NOTE: query shape kept identical to the one verified working in the
  // browser (content_type + fields.slug + access_token). No &select and no
  // &include, on purpose: the article's own fields.name is always returned at
  // items[0].fields.name regardless, and avoiding extra params removes any
  // untested variable. We only read fields.name, so we ignore everything else.
  var url = 'https://cdn.contentful.com/spaces/' + CONTENTFUL_SPACE +
            '/environments/' + CONTENTFUL_ENV + '/entries' +
            '?content_type=' + encodeURIComponent(CONTENTFUL_CT) +
            '&fields.slug=' + encodeURIComponent(slug) +
            '&access_token=' + CONTENTFUL_TOKEN;

  // Try up to twice: a single retry only helps transient failures (429 / 5xx /
  // network). A 200-with-no-match or a hard 4xx won't change on retry, so we
  // return immediately in those cases.
  for (var attempt = 1; attempt <= 2; attempt++) {
    try {
      var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      var code = resp.getResponseCode();
      if (code === 200) {
        var data = JSON.parse(resp.getContentText());
        if (data && data.items && data.items.length > 0 &&
            data.items[0].fields && data.items[0].fields.name) {
          return String(data.items[0].fields.name);   // the article name
        }
        Logger.log('Contentful 200 but no name for slug "' + slug + '".');
        return '';   // valid response, just no match — do not retry
      }
      Logger.log('Contentful HTTP ' + code + ' for slug "' + slug +
                 '" (attempt ' + attempt + '): ' + resp.getContentText().slice(0, 150));
      // Only 429 (rate limit) and 5xx are worth retrying; other 4xx won't fix.
      if (code !== 429 && code < 500) return '';
    } catch (e) {
      Logger.log('Contentful fetch error for slug "' + slug +
                 '" (attempt ' + attempt + '): ' + e);
    }
    if (attempt < 2) Utilities.sleep(600);   // brief backoff before the retry
  }
  return '';
}

// Compute the translationKey for ONE doc. Only HC docs are looked up in
// Contentful; KA docs (not in Contentful) return ''. Returns '' on any failure
// so the caller can leave the cell empty and retry on a later run.
function computeTranslationKeyForDoc_(doc, folder) {
  if (folder !== 'HC') return '';        // KA is not in Contentful
  var slug = extractSlugFromDoc_(doc);
  if (!slug) return '';
  var name = fetchContentfulNameBySlug_(slug);
  if (!name) return '';
  return translationKeyFromName_(name);
}


/* ================================================================
 * TRANSLATION KEY — one-time backfill (v1.5.0)
 * Fills translationKey for existing HC rows that don't have one yet.
 * Resumable: it remembers a cursor and stops near the time budget, so
 * just re-run it until it reports "0 pending". KA rows are skipped (they
 * keep an empty translationKey). Existing data is never altered except
 * the single translationKey cell of each processed row.
 * ================================================================ */
function backfillTranslationKeyOnce() {
  var startTime = Date.now();
  var sheet = getSheet_();
  var n = sheet.getLastRow() - 1;
  if (n < 1) { Logger.log('Corpus vacío, nada que hacer.'); return; }

  var docIdCol = COLUMNS.indexOf('docId') + 1;
  var laneCol  = COLUMNS.indexOf('lane') + 1;
  var tkeyCol  = COLUMNS.indexOf('translationKey') + 1;

  var ids   = sheet.getRange(2, docIdCol, n, 1).getValues();
  var lanes = sheet.getRange(2, laneCol,  n, 1).getValues();
  var tkeys = sheet.getRange(2, tkeyCol,  n, 1).getValues();

  var cursor = Number(getProp_(P.TKEY_CURSOR, '0'));
  var processed = 0, filled = 0, failed = 0;

  for (var r = cursor; r < n; r++) {
    if (Date.now() - startTime > MAX_RUNTIME_MS) {
      // Save cursor and stop; re-run to continue.
      PropertiesService.getScriptProperties().setProperty(P.TKEY_CURSOR, String(r));
      Logger.log('Time budget hit. Stopped at row ' + (r + 2) + '. Re-run backfillTranslationKeyOnce() to continue.');
      Logger.log('Progress so far this run — processed: ' + processed + ', filled: ' + filled + ', failed: ' + failed);
      return;
    }

    var lane = String(lanes[r][0] || '').toUpperCase();
    var already = String(tkeys[r][0] || '').trim();

    // Skip KA (no Contentful) and rows that already have a key.
    if (lane !== 'HC') { continue; }
    if (already) { continue; }

    var docId = String(ids[r][0] || '').trim();
    if (!docId) { continue; }

    processed++;
    try {
      var doc = DocumentApp.openById(docId);
      var key = computeTranslationKeyForDoc_(doc, 'HC');
      if (key) {
        sheet.getRange(r + 2, tkeyCol).setValue(key);
        filled++;
      } else {
        failed++;             // left empty on purpose; retried next run
      }
    } catch (e) {
      failed++;
      Logger.log('Row ' + (r + 2) + ' (docId ' + docId + ') failed: ' + e);
    }

    // Gentle pacing so we don't hammer Contentful.
    Utilities.sleep(120);
  }

  // Reached the end of the sheet — clear the cursor.
  PropertiesService.getScriptProperties().deleteProperty(P.TKEY_CURSOR);
  Logger.log('translationKey backfill COMPLETE pass.');
  Logger.log('  processed this pass: ' + processed + ', filled: ' + filled + ', still-empty (retry): ' + failed);
  if (failed > 0) {
    Logger.log('  ' + failed + ' HC rows still have no translationKey. Re-run backfillTranslationKeyOnce() to retry just those.');
  }
}

// Diagnostic: how many HC rows still lack a translationKey?
function translationKeyStatus() {
  var sheet = getSheet_();
  var n = sheet.getLastRow() - 1;
  if (n < 1) { Logger.log('Corpus vacío.'); return; }
  var laneCol = COLUMNS.indexOf('lane') + 1;
  var tkeyCol = COLUMNS.indexOf('translationKey') + 1;
  var lanes = sheet.getRange(2, laneCol, n, 1).getValues();
  var tkeys = sheet.getRange(2, tkeyCol, n, 1).getValues();
  var hc = 0, hcFilled = 0, hcEmpty = 0;
  for (var r = 0; r < n; r++) {
    if (String(lanes[r][0] || '').toUpperCase() === 'HC') {
      hc++;
      if (String(tkeys[r][0] || '').trim()) hcFilled++; else hcEmpty++;
    }
  }
  Logger.log('HC rows: ' + hc + ' | with translationKey: ' + hcFilled + ' | still empty: ' + hcEmpty);
}


/* ================================================================
 * DETERMINISTIC ENRICHMENT — lifecycle + kaSubject parsers
 * Pure title/fileName parsing, no AI. Same value every run.
 * ================================================================ */

// lifecycle: ended | deprecated | pilot | experiment | active
// Order matters: ended/deprecated win over experiment/pilot when a title
// carries more than one marker (e.g. "(Experiment) (ENDED)" -> ended).
function parseLifecycle_(title, fileName) {
  var hay = ((title || '') + ' ' + (fileName || '')).toLowerCase();
  if (hay.indexOf('discontinued') !== -1 ||
      hay.indexOf('turned off')   !== -1 ||
      hay.indexOf('(ended)')      !== -1 ||
      hay.indexOf('[ended]')      !== -1 ||
      hay.indexOf('sunset')       !== -1) {
    return 'ended';
  }
  if (hay.indexOf('deprecated') !== -1) return 'deprecated';
  if (hay.indexOf('pilot')      !== -1) return 'pilot';
  if (hay.indexOf('experiment') !== -1) return 'experiment';
  return 'active';
}

// kaSubject: rep | pro and customer | pro | customer | ''  (KA only)
function parseKaSubject_(title) {
  var t = (title || '').toLowerCase();
  var hasRep  = /\(\s*rep\s*\)/.test(t) || /\(\s*sales rep\s*\)/.test(t);
  var hasPro  = /\(\s*pros?\s*\)/.test(t);
  var hasCust = /\(\s*customers?\s*\)/.test(t);
  if (hasRep) return 'rep';
  if (hasPro && hasCust) return 'pro and customer';
  if (hasPro) return 'pro';
  if (hasCust) return 'customer';
  return '';
}


/* ================================================================
 * ENRICHMENT — ONE-TIME BACKFILL: lifecycle + kaSubject
 * Computes both for every existing row from its title/lane. Pure
 * parsing, no AI, runs in seconds. Safe to run any number of times
 * (it just recomputes the same deterministic values).
 * ================================================================ */
function applyLifecycleAndSubjectOnce() {
  var sheet = getSheet_();
  var n = sheet.getLastRow() - 1;
  if (n < 1) { Logger.log('Corpus vacío, nada que hacer.'); return; }

  var titleCol = COLUMNS.indexOf('title') + 1;
  var laneCol  = COLUMNS.indexOf('lane') + 1;
  var fnCol    = COLUMNS.indexOf('fileName') + 1;
  var lifeCol  = COLUMNS.indexOf('lifecycle') + 1;
  var subCol   = COLUMNS.indexOf('kaSubject') + 1;

  var titles = sheet.getRange(2, titleCol, n, 1).getValues();
  var lanes  = sheet.getRange(2, laneCol,  n, 1).getValues();
  var fns    = sheet.getRange(2, fnCol,    n, 1).getValues();

  var lifeOut = [], subOut = [];
  var lifeCounts = {}, subCounts = {};
  for (var r = 0; r < n; r++) {
    var lc = parseLifecycle_(String(titles[r][0] || ''), String(fns[r][0] || ''));
    var ks = (String(lanes[r][0]) === 'KA') ? parseKaSubject_(String(titles[r][0] || '')) : '';
    lifeOut.push([lc]);
    subOut.push([ks]);
    lifeCounts[lc] = (lifeCounts[lc] || 0) + 1;
    var key = ks || '(blank)';
    subCounts[key] = (subCounts[key] || 0) + 1;
  }

  sheet.getRange(2, lifeCol, n, 1).setValues(lifeOut);
  sheet.getRange(2, subCol,  n, 1).setValues(subOut);

  Logger.log('Lifecycle + kaSubject backfilled on ' + n + ' rows.');
  Logger.log('  lifecycle: ' + JSON.stringify(lifeCounts));
  Logger.log('  kaSubject: ' + JSON.stringify(subCounts));
}


/* ================================================================
 * ONE-TIME METADATA REPAIR (v1.1.0)
 * Re-parses the fileName of every existing row and rewrites ONLY the
 * audience and internalAudience columns. Does NOT open any doc.
 * ================================================================ */
function fixMetadataOnce() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) { Logger.log('Sheet is empty, nothing to fix.'); return; }

  var fnCol  = COLUMNS.indexOf('fileName') + 1;
  var audCol = COLUMNS.indexOf('audience') + 1;
  var intCol = COLUMNS.indexOf('internalAudience') + 1;

  var n = lastRow - 1;
  var fileNames = sheet.getRange(2, fnCol, n, 1).getValues();
  var audOut = [];
  var intOut = [];
  var changedAud = 0, changedInt = 0;

  var curAud = sheet.getRange(2, audCol, n, 1).getValues();
  var curInt = sheet.getRange(2, intCol, n, 1).getValues();

  for (var r = 0; r < n; r++) {
    var meta = parseFileName_(String(fileNames[r][0] || ''));
    var newAud = meta.audience || '';
    var newInt = meta.internalAudience || '';
    if (String(curAud[r][0] || '') !== newAud) changedAud++;
    if (String(curInt[r][0] || '') !== newInt) changedInt++;
    audOut.push([newAud]);
    intOut.push([newInt]);
  }

  sheet.getRange(2, audCol, n, 1).setValues(audOut);
  sheet.getRange(2, intCol, n, 1).setValues(intOut);

  Logger.log('Metadata repair done — rows scanned: ' + n +
             ', audience updated: ' + changedAud +
             ', internalAudience updated: ' + changedInt);
}


/* ================================================================
 * CORE — read one doc and upsert its row in the Sheet
 * ================================================================ */
function writeDoc_(file, folder, sheet) {
  var fields = extractFields_(file, folder, sheet);
  writeRowPreserving_(sheet, fields);
}

// Write a row, but carry over PRESERVED_COLUMNS from the existing row (if any)
// whenever the freshly-extracted fields don't provide a value for them. This
// is what stops a re-sync from wiping the seeded topicId / AI summary /
// translationKey / etc.
function writeRowPreserving_(sheet, fields) {
  var existingRow = findRow_(sheet, fields.docId);
  if (existingRow !== -1) {
    var preserved = readPreserved_(sheet, existingRow);
    PRESERVED_COLUMNS.forEach(function (col) {
      if (fields[col] === undefined || fields[col] === '') {
        fields[col] = preserved[col] || '';
      }
    });
  }
  upsertRow_(sheet, fields.docId, buildRow_(fields));
}

// Read just the PRESERVED_COLUMNS values from one existing row.
function readPreserved_(sheet, rowIndex) {
  var row = sheet.getRange(rowIndex, 1, 1, COLUMNS.length).getValues()[0];
  var out = {};
  PRESERVED_COLUMNS.forEach(function (col) {
    out[col] = row[COLUMNS.indexOf(col)];
  });
  return out;
}

// extractFields_ now also computes translationKey for HC docs, BUT only when
// the existing row doesn't already have one (checked via the sheet). This keeps
// Contentful calls rare: a changed doc that already has a key won't be re-fetched.
function extractFields_(file, folder, sheet) {
  var docId = file.getId();
  var fileName = file.getName();
  var meta = parseFileName_(fileName);

  var doc = DocumentApp.openById(docId);
  var body = doc.getBody();

  var fullText = body.getText() || '';
  if (fullText.length > MAX_CELL_CHARS) fullText = fullText.slice(0, MAX_CELL_CHARS);

  var headings = collectHeadings_(body);
  if (headings.length > MAX_CELL_CHARS) headings = headings.slice(0, MAX_CELL_CHARS);

  var wordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;

  // translationKey: only compute (i.e. call Contentful) for HC docs that don't
  // already have a key in the sheet. writeRowPreserving_ will carry an existing
  // key over, so leaving this '' for an already-keyed doc is safe.
  var translationKey = '';
  try {
    if (folder === 'HC' && sheet) {
      var existingRow = findRow_(sheet, docId);
      var hasKey = false;
      if (existingRow !== -1) {
        var tkeyCol = COLUMNS.indexOf('translationKey') + 1;
        hasKey = !!String(sheet.getRange(existingRow, tkeyCol).getValue() || '').trim();
      }
      if (!hasKey) {
        translationKey = computeTranslationKeyForDoc_(doc, 'HC');  // '' on failure -> retried later
      }
    }
  } catch (e) {
    Logger.log('translationKey compute skipped for ' + docId + ': ' + e);
    translationKey = '';
  }

  return {
    docId: docId,
    title: meta.title || fileName,
    url: file.getUrl(),
    fileName: fileName,
    lane: folder,                          // 'HC' or 'KA' (from the folder)
    audience: meta.audience || '',
    language: meta.language || '',
    internalAudience: meta.internalAudience || '',
    headings: headings,
    wordCount: wordCount,
    lastUpdated: file.getLastUpdated().getTime(),
    lastSynced: new Date().toISOString(),
    status: 'OK',
    // Deterministic enrichment — recomputed every sync (title-driven, stable):
    lifecycle: parseLifecycle_(meta.title || fileName, fileName),
    kaSubject: (folder === 'KA') ? parseKaSubject_(meta.title || fileName) : '',
    // Preserved enrichment (topicId, topicRole, summary, concepts, aliases,
    // translationKey) is carried over from the existing row by
    // writeRowPreserving_() when not freshly provided here.
    translationKey: translationKey,
    fullText: fullText
  };
}

function collectHeadings_(body) {
  var out = [];
  var H = DocumentApp.ParagraphHeading;
  var n = body.getNumChildren();
  for (var i = 0; i < n; i++) {
    var el = body.getChild(i);
    if (el.getType() === DocumentApp.ElementType.PARAGRAPH) {
      var para = el.asParagraph();
      var h = para.getHeading();
      if (h === H.HEADING1 || h === H.HEADING2 || h === H.HEADING3) {
        var t = para.getText();
        if (t) out.push(t.trim());
      }
    }
  }
  return out.join(' | ');
}

function buildRow_(f) {
  return COLUMNS.map(function (col) { return f[col] !== undefined ? f[col] : ''; });
}


/* ================================================================
 * FILENAME PARSING
 * ================================================================ */
function parseFileName_(name) {
  var result = { title: name, audience: null, internalAudience: null, language: null };
  if (!name) return result;
  var parts = name.split(' - ').map(function (p) { return p.trim(); });

  var LANGS = ['EN', 'ES', 'PT'];
  for (var i = parts.length - 1; i >= 0; i--) {
    if (LANGS.indexOf(parts[i].toUpperCase()) !== -1) { result.language = parts[i].toUpperCase(); break; }
  }

  var AUDS = ['pro and customer', 'pro', 'customer', 'general'];
  for (var j = 0; j < parts.length; j++) {
    if (AUDS.indexOf(parts[j].toLowerCase()) !== -1) { result.audience = parts[j].toLowerCase(); break; }
  }

  var KA_AUDS = ['Support Ops', 'GTM', 'Trust & Safety'];
  var KA_ALIASES = { 'sales': 'GTM' };
  for (var k = 0; k < parts.length; k++) {
    var partLower = parts[k].toLowerCase();
    if (KA_ALIASES[partLower]) { result.internalAudience = KA_ALIASES[partLower]; break; }
    for (var m = 0; m < KA_AUDS.length; m++) {
      if (partLower === KA_AUDS[m].toLowerCase()) { result.internalAudience = KA_AUDS[m]; break; }
    }
    if (result.internalAudience) break;
  }

  if (parts.length > 0) result.title = parts[0];
  return result;
}


/* ================================================================
 * DRIVE HELPERS
 * ================================================================ */
function listAllDocs_() {
  var out = [];
  collectDocs_(HC_FOLDER_ID, 'HC', out);
  collectDocs_(KA_FOLDER_ID, 'KA', out);
  return out;
}

function collectDocs_(folderId, label, out) {
  var folder = DriveApp.getFolderById(folderId);
  var it = folder.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    var mime = f.getMimeType();
    if (mime === MimeType.GOOGLE_DOCS) {
      out.push({ file: f, folder: label });
    } else if (mime === MimeType.SHORTCUT) {
      try {
        var targetId = f.getTargetId();
        if (targetId) {
          var target = DriveApp.getFileById(targetId);
          if (target.getMimeType() === MimeType.GOOGLE_DOCS) {
            out.push({ file: target, folder: label });
          }
        }
      } catch (e) { /* broken shortcut — skip */ }
    }
  }
}


/* ================================================================
 * DIAGNOSTIC — what can this script actually SEE in each folder?
 * ================================================================ */
function auditFolders() {
  var targets = [
    { id: HC_FOLDER_ID, label: 'HC' },
    { id: KA_FOLDER_ID, label: 'KA' }
  ];
  targets.forEach(function (t) {
    var folder = DriveApp.getFolderById(t.id);
    var it = folder.getFiles();
    var byMime = {};
    var nonDocsNames = [];
    var total = 0;
    while (it.hasNext()) {
      var f = it.next();
      total++;
      var mime = f.getMimeType();
      byMime[mime] = (byMime[mime] || 0) + 1;
      if (mime !== MimeType.GOOGLE_DOCS && nonDocsNames.length < 20) {
        nonDocsNames.push(f.getName() + '  [' + mime + ']');
      }
    }
    var subIt = folder.getFolders();
    var subCount = 0;
    var subNames = [];
    while (subIt.hasNext()) {
      var sf = subIt.next();
      subCount++;
      if (subNames.length < 10) subNames.push(sf.getName());
    }
    Logger.log('=== ' + t.label + ' folder ===');
    Logger.log('Total files visible: ' + total);
    Logger.log('By mime type: ' + JSON.stringify(byMime));
    Logger.log('Subfolders: ' + subCount + (subCount ? ' -> ' + subNames.join(', ') : ''));
    if (nonDocsNames.length) {
      Logger.log('Files that are NOT native Google Docs (skipped by sync):');
      nonDocsNames.forEach(function (n) { Logger.log('  - ' + n); });
    }
  });
}


/* ================================================================
 * SHEET HELPERS
 * ================================================================ */
function getSheet_() {
  var id = getProp_(P.SHEET_ID);
  return SpreadsheetApp.openById(id).getSheetByName('corpus');
}

function loadExisting_(sheet) {
  var lastRow = sheet.getLastRow();
  var map = {};
  if (lastRow < 2) return map;
  var idCol = COLUMNS.indexOf('docId') + 1;
  var upCol = COLUMNS.indexOf('lastUpdated') + 1;
  var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  var ups = sheet.getRange(2, upCol, lastRow - 1, 1).getValues();
  for (var r = 0; r < ids.length; r++) {
    var id = ids[r][0];
    if (id) map[id] = { rowIndex: r + 2, lastUpdated: ups[r][0] };
  }
  return map;
}

function upsertRow_(sheet, docId, rowData) {
  var existing = findRow_(sheet, docId);
  if (existing === -1) {
    sheet.appendRow(rowData);
  } else {
    sheet.getRange(existing, 1, 1, COLUMNS.length).setValues([rowData]);
  }
}

function upsertError_(sheet, file, folder, message) {
  try {
    var f = {
      docId: file.getId(), title: file.getName(), url: file.getUrl(),
      fileName: file.getName(), lane: folder, audience: '', language: '',
      internalAudience: '', headings: '', wordCount: 0,
      lastUpdated: file.getLastUpdated().getTime(),
      lastSynced: new Date().toISOString(),
      status: 'ERROR: ' + message, translationKey: '', fullText: ''
    };
    writeRowPreserving_(sheet, f);
  } catch (e) { /* non-fatal */ }
}

function findRow_(sheet, docId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var idCol = COLUMNS.indexOf('docId') + 1;
  var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (var r = 0; r < ids.length; r++) {
    if (ids[r][0] === docId) return r + 2;
  }
  return -1;
}

function removeRow_(sheet, rowIndex) {
  sheet.deleteRow(rowIndex);
}


/* ================================================================
 * TRIGGER-CHAINING HELPERS (initial load only)
 * ================================================================ */
function scheduleChainContinuation_() {
  cleanupChainTriggers_();
  ScriptApp.newTrigger('runInitialLoadBatch').timeBased().after(60 * 1000).create();
}

function cleanupChainTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'runInitialLoadBatch') ScriptApp.deleteTrigger(t);
  });
}


/* ================================================================
 * MISC
 * ================================================================ */
function getProp_(key, fallback) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  if (v === null || v === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error('Missing Script Property: ' + key);
  }
  return v;
}

function showCorpusSheetId() {
  var id = PropertiesService.getScriptProperties().getProperty('CORPUS_SHEET_ID');
  Logger.log('Corpus Sheet ID: ' + id);
  Logger.log('Open it here: https://docs.google.com/spreadsheets/d/' + id + '/edit');
}
/**
 * ENRICHMENT — apply authored summary/concepts/aliases (one-time).
 * Reads the 'enrich_seed' tab and writes summary + concepts + aliases into
 * the matching corpus rows (matched by docId). Only fills the 396 pending
 * rows; does NOT touch the rows Gemini already enriched (it overwrites by
 * docId only for the docIds present in the seed). Run once.
 */
function applyEnrichOnce() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var seed = ss.getSheetByName('enrich_seed');
  if (!seed) throw new Error('No encuentro la hoja enrich_seed. Revisa el nombre exacto.');

  var sData = seed.getDataRange().getValues();
  var sHdr = sData[0];
  var cDoc = sHdr.indexOf('docId');
  var cSum = sHdr.indexOf('summary');
  var cCon = sHdr.indexOf('concepts');
  var cAli = sHdr.indexOf('aliases');
  if (cDoc < 0 || cSum < 0 || cCon < 0 || cAli < 0) {
    throw new Error('Headers del seed no encontrados (docId/summary/concepts/aliases).');
  }

  var seedMap = {};
  for (var i = 1; i < sData.length; i++) {
    var id = String(sData[i][cDoc] || '').trim();
    if (id) seedMap[id] = {
      summary:  sData[i][cSum],
      concepts: sData[i][cCon],
      aliases:  sData[i][cAli]
    };
  }

  var corpus = getSheet_();
  var idCol  = COLUMNS.indexOf('docId') + 1;
  var sumCol = COLUMNS.indexOf('summary') + 1;
  var conCol = COLUMNS.indexOf('concepts') + 1;
  var aliCol = COLUMNS.indexOf('aliases') + 1;
  var lastRow = corpus.getLastRow();
  var n = lastRow - 1;
  if (n < 1) { Logger.log('Corpus vacío.'); return; }

  var ids = corpus.getRange(2, idCol, n, 1).getValues();
  var updated = 0, skipped = 0;
  for (var r = 0; r < n; r++) {
    var id = String(ids[r][0] || '').trim();
    var s = seedMap[id];
    if (!s) { skipped++; continue; }   // not in seed (already-enriched or other) -> leave as is
    // summary, concepts, aliases are contiguous -> one write
    corpus.getRange(r + 2, sumCol, 1, 3).setValues([[s.summary || '', s.concepts || '', s.aliases || '']]);
    updated++;
  }
  Logger.log('Enrich applied. Updated: ' + updated + ', left untouched (not in seed): ' + skipped + ', total rows: ' + n);
}
/**
 * RECOVERY — restore fullText (one-time, SAFE).
 * Reads the 'fulltext_seed' tab (docId, fullText) and writes the body text
 * back into the corpus, matched by docId. Writes ONLY the fullText column
 * — it does NOT touch any other column, so topicId / topicRole / lifecycle /
 * kaSubject / summary / concepts / aliases / translationKey are 100% untouched.
 * For any docId not in the seed, the existing fullText cell is left as-is.
 * Run once.
 */
function applyFullTextOnce() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var seed = ss.getSheetByName('fulltext_seed');
  if (!seed) throw new Error('No encuentro la hoja fulltext_seed. Revisa el nombre exacto.');

  // Build docId -> fullText from the seed.
  var sData = seed.getDataRange().getValues();
  var sHdr = sData[0];
  var cDoc = sHdr.indexOf('docId');
  var cFt  = sHdr.indexOf('fullText');
  if (cDoc < 0 || cFt < 0) {
    throw new Error('Headers del seed no encontrados (docId / fullText).');
  }
  var seedMap = {};
  for (var i = 1; i < sData.length; i++) {
    var id = String(sData[i][cDoc] || '').trim();
    if (id) seedMap[id] = sData[i][cFt];
  }

  var corpus = getSheet_();
  var idCol = COLUMNS.indexOf('docId') + 1;
  var ftCol = COLUMNS.indexOf('fullText') + 1;
  var n = corpus.getLastRow() - 1;
  if (n < 1) { Logger.log('Corpus vacío.'); return; }

  // Read docIds and the CURRENT fullText column (so non-seed rows stay as-is).
  var ids = corpus.getRange(2, idCol, n, 1).getValues();
  var cur = corpus.getRange(2, ftCol, n, 1).getValues();

  var out = [];
  var restored = 0, left = 0;
  for (var r = 0; r < n; r++) {
    var id = String(ids[r][0] || '').trim();
    if (Object.prototype.hasOwnProperty.call(seedMap, id)) {
      out.push([ seedMap[id] || '' ]);
      restored++;
    } else {
      out.push([ cur[r][0] ]);   // not in seed -> keep whatever is there
      left++;
    }
  }

  // ONE write, ONLY the fullText column. No other column is touched.
  corpus.getRange(2, ftCol, n, 1).setValues(out);
  Logger.log('fullText restored. Restored: ' + restored + ', left as-is (not in seed): ' + left + ', total rows: ' + n);
}
/**
 * Disparo manual de la cadena Drive -> corpus -> tracker.
 * Lo invoca el trigger que crea ?mode=corpus_sync en el web app.
 */
function runManualCorpusSync() {
  try {
    nightlySync();                 // Drive -> corpus   (solo reescribe lo que cambió)
    buildLocalizationTracker();    // corpus -> tracker (preserva los estados manuales)
    Logger.log('runManualCorpusSync: cadena completa OK.');
  } catch (err) {
    Logger.log('runManualCorpusSync FALLO: ' + err);
    throw err;
  } finally {
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (t.getHandlerFunction() === 'runManualCorpusSync') ScriptApp.deleteTrigger(t);
    });
  }
}