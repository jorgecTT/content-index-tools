/**
 * ================================================================
 * Content Audit — URL Index  (UrlIndex.gs)
 * v1.1.0
 * ================================================================
 * Lives in the SAME Apps Script project as CorpusSync.gs, WebApp.gs
 * and LocalizationTracker.gs. Reuses COLUMNS, getSheet_ and
 * CORPUS_SHEET_ID_LITERAL from CorpusSync.gs — do not redeclare.
 *
 * v1.1.0 changes (PUBLISHED urls — the real fix):
 *   - The corpus 'url' column holds GOOGLE DOC urls, not published
 *     Help Center urls. So the published link is now read from THE
 *     PAGE HEADER OF EACH GOOGLE DOC (line 1 of the header = the
 *     published help.thumbtack.com link, per the HC doc format spec
 *     maintained by HC Sync / Auto Sync).
 *   - INCREMENTAL FETCH with a time guard: opening ~290 docs can
 *     exceed the Apps Script 6-minute limit, so each run (a) reuses
 *     every published url already stored in the url_index tab
 *     (matched by docId, only urls containing help.thumbtack.com),
 *     and (b) opens only the docs still missing one, stopping safely
 *     at ~4.5 minutes. Re-run until the log says "missing: 0".
 *     Nightly runs after that only touch new docs — seconds.
 *   - Docs whose header is missing or has no help.thumbtack.com link
 *     are flagged visibly in 'notes' — never guessed, never dropped.
 *
 * WHAT IT DOES:
 *   Builds and maintains a 'url_index' tab in the SAME corpus Sheet:
 *   one row per translationKey+audience group (HC lane, active only),
 *   pairing the EN / ES / PT siblings with their PUBLISHED
 *   help.thumbtack.com URLs. Purpose: a skill-friendly lookup to jump
 *   from an article to its sibling's live URL.
 *
 * SAFETY GUARANTEES:
 *   - READS the 'corpus' tab (light columns, NEVER fullText) and the
 *     HEADERS of the corpus Google Docs (read-only, content untouched).
 *   - WRITES ONLY to the 'url_index' tab. Corpus, tracker and
 *     glossary tabs are never modified in any way.
 *   - Builds all rows in memory, ONE setValues() at the end.
 *   - Fully automatic tab, safe to rebuild anytime.
 *
 * SCHEMA (url_index):
 *   translationKey | audience | titleEN | titleES | titlePT |
 *   urlEN | urlES | urlPT | docIdEN | docIdES | docIdPT | notes
 *
 * SETUP:
 *   1) buildUrlIndex()          -> run REPEATEDLY until the log says
 *                                  "missing: 0" (first fill takes 2-3
 *                                  runs because of the time guard)
 *   2) installUrlIndexTrigger() -> daily rebuild ~6 AM (idempotent)
 * ================================================================ */

var URLINDEX_TAB_NAME = 'url_index';

var URLINDEX_COLUMNS = [
  'translationKey', 'audience', 'titleEN', 'titleES', 'titlePT',
  'urlEN', 'urlES', 'urlPT', 'docIdEN', 'docIdES', 'docIdPT', 'notes'
];

// Stop opening new docs after this many ms (Apps Script hard limit is 6 min).
var URLINDEX_TIME_BUDGET_MS = 270000;   // 4.5 minutes

// Only urls from the live Help Center count as "published".
var URLINDEX_PUBLISHED_PATTERN = /https?:\/\/help\.thumbtack\.com\/[^\s"'<>\)\]]+/;


/* ================================================================
 * MAIN — build (or rebuild) the url_index tab. Safe to run anytime.
 * Incremental: run repeatedly until the log reports "missing: 0".
 * ================================================================ */
function buildUrlIndex() {
  var startTime = Date.now();
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var corpus = getSheet_();

  // ---- 1) READ light columns from the corpus tab (never fullText) ----
  var n = corpus.getLastRow() - 1;
  if (n < 1) { Logger.log('Corpus vacío, nada que hacer.'); return; }

  var col = function (name) { return COLUMNS.indexOf(name) + 1; };
  var docIds     = corpus.getRange(2, col('docId'),          n, 1).getValues();
  var titles     = corpus.getRange(2, col('title'),          n, 1).getValues();
  var lanes      = corpus.getRange(2, col('lane'),           n, 1).getValues();
  var audiences  = corpus.getRange(2, col('audience'),       n, 1).getValues();
  var languages  = corpus.getRange(2, col('language'),       n, 1).getValues();
  var lifecycles = corpus.getRange(2, col('lifecycle'),      n, 1).getValues();
  var tkeys      = corpus.getRange(2, col('translationKey'), n, 1).getValues();

  // ---- 2) LOAD the published-url cache from the EXISTING tab ----
  // Map docId -> published url. Only urls that match the Help Center
  // pattern are reused; anything else (e.g. the old Doc urls from
  // v1.0.0) is discarded so this run replaces them.
  var urlCache = {};
  var existing = ss.getSheetByName(URLINDEX_TAB_NAME);
  if (existing && existing.getLastRow() > 1) {
    var eN = existing.getLastRow() - 1;
    var eCols = Math.max(1, existing.getLastColumn());
    var eHdr = existing.getRange(1, 1, 1, eCols).getValues()[0].map(String);
    var eVals = existing.getRange(2, 1, eN, eCols).getValues();
    var pairs = [
      ['docIdEN', 'urlEN'],
      ['docIdES', 'urlES'],
      ['docIdPT', 'urlPT']
    ];
    for (var e = 0; e < eN; e++) {
      for (var p = 0; p < pairs.length; p++) {
        var idIdx = eHdr.indexOf(pairs[p][0]);
        var urlIdx = eHdr.indexOf(pairs[p][1]);
        if (idIdx === -1 || urlIdx === -1) continue;
        var did = String(eVals[e][idIdx] || '').trim();
        var u = String(eVals[e][urlIdx] || '').trim();
        if (did && URLINDEX_PUBLISHED_PATTERN.test(u)) {
          urlCache[did] = u;
        }
      }
    }
  }

  // ---- 3) GROUP HC + active docs by translationKey + audience ----
  var groups = {};      // "key||audience" -> group object
  var noKeyRows = [];   // HC docs without translationKey — visible, never dropped

  for (var r = 0; r < n; r++) {
    var lane = String(lanes[r][0] || '').toUpperCase();
    if (lane !== 'HC') continue;

    var lifecycle = String(lifecycles[r][0] || 'active').toLowerCase();
    if (lifecycle !== 'active') continue;

    var docId = String(docIds[r][0] || '').trim();
    if (!docId) continue;

    var lang = String(languages[r][0] || '').toUpperCase();
    var title = String(titles[r][0] || '');
    var audience = String(audiences[r][0] || '').toLowerCase().trim();
    var key = String(tkeys[r][0] || '').trim();

    if (!key) {
      noKeyRows.push({
        translationKey: '', audience: audience,
        titleEN: (lang === 'EN' ? title : ''),
        titleES: (lang === 'ES' ? title : ''),
        titlePT: (lang === 'PT' ? title : ''),
        docIdEN: (lang === 'EN' ? docId : ''),
        docIdES: (lang === 'ES' ? docId : ''),
        docIdPT: (lang === 'PT' ? docId : ''),
        notes: 'Missing translationKey — run backfillTranslationKeyOnce()'
      });
      continue;
    }

    var bucket = key + '||' + audience;
    if (!groups[bucket]) {
      groups[bucket] = { key: key, audience: audience,
                         titleEN: '', titleES: '', titlePT: '',
                         docIdEN: '', docIdES: '', docIdPT: '',
                         issues: [] };
    }
    var g = groups[bucket];

    if (lang === 'EN') {
      if (g.docIdEN) { g.issues.push('duplicate EN: ' + docId); }
      else { g.docIdEN = docId; g.titleEN = title; }
    } else if (lang === 'ES') {
      if (g.docIdES) { g.issues.push('duplicate ES: ' + docId); }
      else { g.docIdES = docId; g.titleES = title; }
    } else if (lang === 'PT') {
      if (g.docIdPT) { g.issues.push('duplicate PT: ' + docId); }
      else { g.docIdPT = docId; g.titlePT = title; }
    }
  }

  // ---- 4) RESOLVE published urls: cache first, then doc headers,
  //         respecting the time budget ----
  var stats = { cached: 0, fetched: 0, noHeaderLink: 0, pending: 0, errors: 0 };

  // resolveUrl_ returns { url, note } — note is '' when clean.
  function resolveUrl(docId, langLabel) {
    if (!docId) return { url: '', note: '' };

    if (urlCache[docId]) {
      stats.cached++;
      return { url: urlCache[docId], note: '' };
    }

    if (Date.now() - startTime > URLINDEX_TIME_BUDGET_MS) {
      stats.pending++;
      return { url: '', note: langLabel + ': pending (time budget — re-run buildUrlIndex)' };
    }

    try {
      var doc = DocumentApp.openById(docId);
      var header = doc.getHeader();
      if (!header) {
        stats.noHeaderLink++;
        return { url: '', note: langLabel + ': doc has no page header' };
      }
      var text = header.getText();
      var m = String(text || '').match(URLINDEX_PUBLISHED_PATTERN);
      if (!m) {
        stats.noHeaderLink++;
        return { url: '', note: langLabel + ': no help.thumbtack.com link in header' };
      }
      var url = m[0].replace(/[\.,;:]+$/, '');   // strip trailing punctuation
      urlCache[docId] = url;
      stats.fetched++;
      return { url: url, note: '' };
    } catch (err) {
      stats.errors++;
      return { url: '', note: langLabel + ': error opening doc (' + String(err).slice(0, 80) + ')' };
    }
  }

  // ---- 5) BUILD all rows in memory ----
  var rows = [];
  var pairedENES = 0;

  Object.keys(groups).sort().forEach(function (bucket) {
    var g = groups[bucket];

    var en = resolveUrl(g.docIdEN, 'EN');
    var es = resolveUrl(g.docIdES, 'ES');
    var pt = resolveUrl(g.docIdPT, 'PT');

    [en.note, es.note, pt.note].forEach(function (note) {
      if (note) g.issues.push(note);
    });

    if (en.url && es.url) pairedENES++;

    rows.push([
      g.key, g.audience, g.titleEN, g.titleES, g.titlePT,
      en.url, es.url, pt.url,
      g.docIdEN, g.docIdES, g.docIdPT,
      g.issues.join('; ')
    ]);
  });

  noKeyRows.forEach(function (nk) {
    rows.push([
      nk.translationKey, nk.audience, nk.titleEN, nk.titleES, nk.titlePT,
      '', '', '',
      nk.docIdEN, nk.docIdES, nk.docIdPT, nk.notes
    ]);
  });

  // ---- 6) ONE write to the url_index tab ----
  var sh = ss.getSheetByName(URLINDEX_TAB_NAME);
  if (!sh) sh = ss.insertSheet(URLINDEX_TAB_NAME);
  sh.clearContents();
  sh.getRange(1, 1, 1, URLINDEX_COLUMNS.length).setValues([URLINDEX_COLUMNS]);
  sh.setFrozenRows(1);
  if (rows.length) {
    sh.getRange(2, 1, rows.length, URLINDEX_COLUMNS.length).setValues(rows);
  }

  var missing = stats.pending;
  Logger.log('URL Index rebuilt — ' + rows.length + ' rows (v1.1.0, published urls from doc headers).');
  Logger.log('  reused from cache: ' + stats.cached +
             ' | fetched this run: ' + stats.fetched +
             ' | missing (re-run needed): ' + missing);
  Logger.log('  no link in header: ' + stats.noHeaderLink +
             ' | doc open errors: ' + stats.errors +
             ' | EN+ES published pairs complete: ' + pairedENES);
  if (missing > 0) {
    Logger.log('  >>> RUN buildUrlIndex() AGAIN — ' + missing + ' docs still pending.');
  } else {
    Logger.log('  >>> DONE. All reachable docs resolved. Check notes column for the flagged ones.');
  }
}


/* ================================================================
 * ONE-TIME — install the nightly rebuild trigger (~6 AM, AFTER the
 * corpus sync at ~5 AM so URLs always reflect fresh data).
 * ================================================================ */
function installUrlIndexTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'buildUrlIndex') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('buildUrlIndex')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();
  Logger.log('URL Index nightly trigger installed (~6 AM daily).');
}