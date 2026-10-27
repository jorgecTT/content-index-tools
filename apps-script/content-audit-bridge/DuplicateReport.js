/**
 * ================================================================
 * Content Audit — Duplicate Report + Note Cleanup  (NEW FILE)
 * v1.0.0
 * ================================================================
 * Lives in the SAME Apps Script project as CorpusSync.gs +
 * LocalizationTracker.gs. Reuses COLUMNS, getSheet_,
 * CORPUS_SHEET_ID_LITERAL, TRACKER_TAB_NAME, TRACKER_COLUMNS.
 *
 * TWO FUNCTIONS:
 *
 * 1) reportDuplicateDocs()  — READ-ONLY diagnostic.
 *    Lists every translationKey that has 2+ docs in the SAME language,
 *    with each doc's fileName, docId, URL and last-updated date, so you
 *    can decide which one to delete manually in the Drive. Deletions
 *    are yours, as always — this writes nothing.
 *
 * 2) cleanStackedDupeNotesOnce() — one-time cosmetic fix.
 *    Early tracker versions stacked the same "duplicate EN: ..." note
 *    on every nightly rebuild. This dedupes the notes cell of every
 *    tracker row (removes repeated segments, keeps unique ones and any
 *    real audit notes intact). Writes ONLY the notes column of the
 *    tracker tab. Safe to run once; harmless if run again.
 * ================================================================ */

function reportDuplicateDocs() {
  var sheet = getSheet_();
  var n = sheet.getLastRow() - 1;
  if (n < 1) { Logger.log('Corpus vacío.'); return; }

  var col = function (name) { return COLUMNS.indexOf(name) + 1; };
  var docIds    = sheet.getRange(2, col('docId'),          n, 1).getValues();
  var fileNames = sheet.getRange(2, col('fileName'),       n, 1).getValues();
  var lanes     = sheet.getRange(2, col('lane'),           n, 1).getValues();
  var languages = sheet.getRange(2, col('language'),       n, 1).getValues();
  var tkeys     = sheet.getRange(2, col('translationKey'), n, 1).getValues();
  var lastUpds  = sheet.getRange(2, col('lastUpdated'),    n, 1).getValues();
  var urls      = sheet.getRange(2, col('url'),            n, 1).getValues();

  // Group HC docs by translationKey + language.
  var byKeyLang = {};   // "key||LANG" -> [ {docId, fileName, url, lastUpdated} ]
  for (var r = 0; r < n; r++) {
    if (String(lanes[r][0] || '').toUpperCase() !== 'HC') continue;
    var key = String(tkeys[r][0] || '').trim();
    if (!key) continue;
    var lang = String(languages[r][0] || '').toUpperCase();
    var bucket = key + '||' + lang;
    if (!byKeyLang[bucket]) byKeyLang[bucket] = [];
    byKeyLang[bucket].push({
      docId: String(docIds[r][0] || ''),
      fileName: String(fileNames[r][0] || ''),
      url: String(urls[r][0] || ''),
      lastUpdated: Number(lastUpds[r][0] || 0)
    });
  }

  var dupGroups = 0;
  Logger.log('=== DUPLICATE DOCS REPORT (same translationKey + same language) ===');
  Object.keys(byKeyLang).sort().forEach(function (bucket) {
    var docs = byKeyLang[bucket];
    if (docs.length < 2) return;
    dupGroups++;
    var parts = bucket.split('||');
    Logger.log('');
    Logger.log('KEY: "' + parts[0] + '"  [' + parts[1] + ']  — ' + docs.length + ' docs:');
    // Newest first, so the likely keeper is on top.
    docs.sort(function (a, b) { return b.lastUpdated - a.lastUpdated; });
    docs.forEach(function (d, i) {
      var when = d.lastUpdated ? new Date(d.lastUpdated).toISOString().slice(0, 10) : '(no date)';
      Logger.log('  ' + (i + 1) + '. ' + d.fileName);
      Logger.log('       updated: ' + when + '   docId: ' + d.docId);
      Logger.log('       ' + d.url);
    });
  });

  if (dupGroups === 0) {
    Logger.log('No duplicates found. Corpus is clean.');
  } else {
    Logger.log('');
    Logger.log('TOTAL duplicate groups: ' + dupGroups);
    Logger.log('Newest doc listed first in each group. Deletions are manual, in the Drive.');
    Logger.log('After deleting: the nightly sync removes the row from the corpus, and the');
    Logger.log('6 AM tracker rebuild clears the duplicate note automatically.');
  }
}


function cleanStackedDupeNotesOnce() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var tracker = ss.getSheetByName(TRACKER_TAB_NAME);
  if (!tracker || tracker.getLastRow() < 2) { Logger.log('Tracker vacío o no existe.'); return; }

  var n = tracker.getLastRow() - 1;
  var noCol = TRACKER_COLUMNS.indexOf('notes') + 1;
  var notes = tracker.getRange(2, noCol, n, 1).getValues();

  var out = [];
  var cleaned = 0;
  for (var r = 0; r < n; r++) {
    var raw = String(notes[r][0] || '');
    if (!raw) { out.push(['']); continue; }
    // Split on the ' | ' separator the tracker uses, dedupe segments, rejoin.
    var segs = raw.split(' | ').map(function (s) { return s.trim(); }).filter(Boolean);
    var seen = {};
    var unique = [];
    segs.forEach(function (s) {
      if (!seen[s]) { seen[s] = true; unique.push(s); }
    });
    var rebuilt = unique.join(' | ');
    if (rebuilt !== raw) cleaned++;
    out.push([rebuilt]);
  }

  // ONE write, ONLY the notes column.
  tracker.getRange(2, noCol, n, 1).setValues(out);
  Logger.log('Notes cleanup done — rows with stacked notes fixed: ' + cleaned + ' / ' + n);
}