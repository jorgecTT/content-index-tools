/**
 * ================================================================
 * Content Audit — KA URL Index  (NEW FILE: KaUrlIndex.gs)
 * v1.0.0
 * ================================================================
 * Lives in the SAME Apps Script project as CorpusSync.gs, WebApp.gs,
 * LocalizationTracker.gs, UrlIndex.gs and SlugAliases.gs. Reuses
 * COLUMNS, getSheet_ and CORPUS_SHEET_ID_LITERAL from CorpusSync.gs
 * — do not redeclare.
 *
 * WHAT IT DOES:
 *   Builds and maintains a 'ka_url_index' tab in the corpus Sheet:
 *   ONE ROW PER KA (lane=KA, active only) with its SALESFORCE url —
 *   the real Lightning Knowledge link, NOT the Drive doc url (the
 *   corpus 'url' column holds Doc urls; same trap as the HC index).
 *   KAs have no language siblings, so the schema is FLAT (no
 *   translationKey grouping, unlike url_index).
 *
 * SOURCE OF TRUTH:
 *   The page header of each KA Google Doc (the gray metadata block
 *   written by the KA Sync format spec). The script extracts the
 *   first *force.com* link found there. Docs whose header is missing
 *   or has no Salesforce link are flagged visibly in 'notes' — never
 *   guessed, never dropped.
 *
 * INCREMENTAL FETCH (same proven pattern as UrlIndex v1.1.0):
 *   Each run reuses every Salesforce url already stored in the tab
 *   (matched by docId), opens only the docs still missing one, and
 *   stops safely at ~4.5 minutes. Re-run until the log says
 *   "missing: 0". Nightly runs only touch new docs — seconds.
 *
 * SAFETY:
 *   - READS the corpus tab (light columns, NEVER fullText) and the
 *     doc headers (read-only, content untouched).
 *   - WRITES ONLY to the 'ka_url_index' tab.
 *   - Builds all rows in memory, ONE setValues() at the end.
 *
 * SCHEMA (ka_url_index):
 *   docId | title | audience | language | salesforceUrl | notes
 *
 * SETUP:
 *   1) buildKaUrlIndex()          -> run until the log says "missing: 0"
 *   2) installKaUrlIndexTrigger() -> daily rebuild ~6 AM (idempotent)
 * ================================================================ */

var KAURLINDEX_TAB_NAME = 'ka_url_index';

var KAURLINDEX_COLUMNS = [
  'docId', 'title', 'audience', 'language', 'salesforceUrl', 'notes'
];

// Stop opening new docs after this many ms (Apps Script hard limit is 6 min).
var KAURLINDEX_TIME_BUDGET_MS = 270000;   // 4.5 minutes

// Any force.com link counts as the Salesforce source url
// (covers thumbtack.lightning.force.com and sandbox variants).
var KAURLINDEX_SF_PATTERN = /https?:\/\/[^\s"'<>\)\]]*force\.com[^\s"'<>\)\]]*/;


/* ================================================================
 * MAIN — build (or rebuild) the ka_url_index tab. Safe to run anytime.
 * Incremental: run repeatedly until the log reports "missing: 0".
 * ================================================================ */
function buildKaUrlIndex() {
  var startTime = Date.now();
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var corpus = getSheet_();

  // ---- 1) READ light columns from the corpus tab (never fullText) ----
  var n = corpus.getLastRow() - 1;
  if (n < 1) { Logger.log('Corpus vacío, nada que hacer.'); return; }

  var col = function (name) { return COLUMNS.indexOf(name) + 1; };
  var docIds     = corpus.getRange(2, col('docId'),     n, 1).getValues();
  var titles     = corpus.getRange(2, col('title'),     n, 1).getValues();
  var lanes      = corpus.getRange(2, col('lane'),      n, 1).getValues();
  var audiences  = corpus.getRange(2, col('audience'),  n, 1).getValues();
  var languages  = corpus.getRange(2, col('language'),  n, 1).getValues();
  var lifecycles = corpus.getRange(2, col('lifecycle'), n, 1).getValues();

  // ---- 2) LOAD the Salesforce-url cache from the EXISTING tab ----
  // Map docId -> salesforceUrl. Only urls matching the force.com
  // pattern are reused; anything else is discarded and re-fetched.
  var urlCache = {};
  var existing = ss.getSheetByName(KAURLINDEX_TAB_NAME);
  if (existing && existing.getLastRow() > 1) {
    var eN = existing.getLastRow() - 1;
    var eCols = Math.max(1, existing.getLastColumn());
    var eHdr = existing.getRange(1, 1, 1, eCols).getValues()[0].map(String);
    var idIdx = eHdr.indexOf('docId');
    var urlIdx = eHdr.indexOf('salesforceUrl');
    if (idIdx !== -1 && urlIdx !== -1) {
      var eVals = existing.getRange(2, 1, eN, eCols).getValues();
      for (var e = 0; e < eN; e++) {
        var did = String(eVals[e][idIdx] || '').trim();
        var u = String(eVals[e][urlIdx] || '').trim();
        if (did && KAURLINDEX_SF_PATTERN.test(u)) {
          urlCache[did] = u;
        }
      }
    }
  }

  // ---- 3) COLLECT KA + active rows ----
  var kas = [];
  for (var r = 0; r < n; r++) {
    var lane = String(lanes[r][0] || '').toUpperCase();
    if (lane !== 'KA') continue;

    var lifecycle = String(lifecycles[r][0] || 'active').toLowerCase();
    if (lifecycle !== 'active') continue;

    var docId = String(docIds[r][0] || '').trim();
    if (!docId) continue;

    kas.push({
      docId: docId,
      title: String(titles[r][0] || ''),
      audience: String(audiences[r][0] || '').trim(),
      language: String(languages[r][0] || '').toUpperCase()
    });
  }

  if (kas.length === 0) {
    Logger.log('No active KA rows found in the corpus (lane=KA). Nothing to index.');
    return;
  }

  // ---- 4) RESOLVE Salesforce urls: cache first, then doc headers,
  //         respecting the time budget ----
  var stats = { cached: 0, fetched: 0, noHeaderLink: 0, pending: 0, errors: 0 };

  function resolveSfUrl(docId) {
    if (urlCache[docId]) {
      stats.cached++;
      return { url: urlCache[docId], note: '' };
    }

    if (Date.now() - startTime > KAURLINDEX_TIME_BUDGET_MS) {
      stats.pending++;
      return { url: '', note: 'pending (time budget — re-run buildKaUrlIndex)' };
    }

    try {
      var doc = DocumentApp.openById(docId);
      var header = doc.getHeader();
      if (!header) {
        stats.noHeaderLink++;
        return { url: '', note: 'doc has no page header' };
      }
      var text = header.getText();
      var m = String(text || '').match(KAURLINDEX_SF_PATTERN);
      if (!m) {
        stats.noHeaderLink++;
        return { url: '', note: 'no force.com link in header' };
      }
      var url = m[0].replace(/[\.,;:]+$/, '');   // strip trailing punctuation
      urlCache[docId] = url;
      stats.fetched++;
      return { url: url, note: '' };
    } catch (err) {
      stats.errors++;
      return { url: '', note: 'error opening doc (' + String(err).slice(0, 80) + ')' };
    }
  }

  // ---- 5) BUILD all rows in memory ----
  var rows = [];
  var withUrl = 0;

  kas.forEach(function (ka) {
    var res = resolveSfUrl(ka.docId);
    if (res.url) withUrl++;
    rows.push([ka.docId, ka.title, ka.audience, ka.language, res.url, res.note]);
  });

  // ---- 6) ONE write to the ka_url_index tab ----
  var sh = ss.getSheetByName(KAURLINDEX_TAB_NAME);
  if (!sh) sh = ss.insertSheet(KAURLINDEX_TAB_NAME);
  sh.clearContents();
  sh.getRange(1, 1, 1, KAURLINDEX_COLUMNS.length).setValues([KAURLINDEX_COLUMNS]);
  sh.setFrozenRows(1);
  if (rows.length) {
    sh.getRange(2, 1, rows.length, KAURLINDEX_COLUMNS.length).setValues(rows);
  }

  Logger.log('KA URL Index rebuilt — ' + rows.length + ' KAs (Salesforce urls from doc headers).');
  Logger.log('  reused from cache: ' + stats.cached +
             ' | fetched this run: ' + stats.fetched +
             ' | missing (re-run needed): ' + stats.pending);
  Logger.log('  no link in header: ' + stats.noHeaderLink +
             ' | doc open errors: ' + stats.errors +
             ' | KAs with Salesforce url: ' + withUrl + '/' + rows.length);
  if (stats.pending > 0) {
    Logger.log('  >>> RUN buildKaUrlIndex() AGAIN — ' + stats.pending + ' docs still pending.');
  } else {
    Logger.log('  >>> DONE. Check the notes column for any flagged docs.');
  }
}


/* ================================================================
 * ONE-TIME — install the nightly rebuild trigger (~6 AM, AFTER the
 * corpus sync at ~5 AM so the index always reflects fresh data).
 * ================================================================ */
function installKaUrlIndexTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'buildKaUrlIndex') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('buildKaUrlIndex')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();
  Logger.log('KA URL Index nightly trigger installed (~6 AM daily).');
}