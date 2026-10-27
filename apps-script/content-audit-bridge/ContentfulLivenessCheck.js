/**
 * ================================================================
 * Content Audit — Contentful Liveness Check  (NEW FILE, DIAGNOSTIC)
 * v1.0.0
 * ================================================================
 * Lives in the SAME Apps Script project as CorpusSync.gs.
 * Reuses COLUMNS, getSheet_, getProp_, extractSlugFromDoc_ and
 * fetchContentfulNameBySlug_ from CorpusSync.gs — do not redeclare.
 *
 * WHAT IT DOES (READ-ONLY — writes NOTHING anywhere):
 *   Walks every HC row in the corpus, opens each Google Doc, reads its
 *   "Slug:" line from the header, and asks Contentful if that slug still
 *   resolves. Logs every article whose slug is GONE from Contentful
 *   (i.e. archived/unpublished) so you can decide what to remove from
 *   the Drive. Also logs docs that have no slug in their header.
 *
 * RESUMABLE: it remembers a cursor and stops near the time budget.
 * Re-run checkContentfulLiveness() until it says COMPLETE — it resumes
 * where it left off and accumulates the findings across runs.
 *
 * To start over from row 0: run resetLivenessCheck() first.
 * ================================================================ */

var LIVENESS_CURSOR_PROP  = 'LIVENESS_CHECK_CURSOR';
var LIVENESS_ARCHIVED_PROP = 'LIVENESS_ARCHIVED_LIST';   // accumulated findings (JSON)
var LIVENESS_NOSLUG_PROP   = 'LIVENESS_NOSLUG_LIST';

function resetLivenessCheck() {
  var p = PropertiesService.getScriptProperties();
  p.deleteProperty(LIVENESS_CURSOR_PROP);
  p.deleteProperty(LIVENESS_ARCHIVED_PROP);
  p.deleteProperty(LIVENESS_NOSLUG_PROP);
  Logger.log('Liveness check reset. Run checkContentfulLiveness() to start from the beginning.');
}

function checkContentfulLiveness() {
  var startTime = Date.now();
  var TIME_BUDGET_MS = 4.5 * 60 * 1000;

  var sheet = getSheet_();
  var n = sheet.getLastRow() - 1;
  if (n < 1) { Logger.log('Corpus vacío.'); return; }

  var col = function (name) { return COLUMNS.indexOf(name) + 1; };
  var docIds    = sheet.getRange(2, col('docId'),    n, 1).getValues();
  var fileNames = sheet.getRange(2, col('fileName'), n, 1).getValues();
  var lanes     = sheet.getRange(2, col('lane'),     n, 1).getValues();

  var p = PropertiesService.getScriptProperties();
  var cursor = Number(p.getProperty(LIVENESS_CURSOR_PROP) || '0');
  var archived = JSON.parse(p.getProperty(LIVENESS_ARCHIVED_PROP) || '[]');
  var noSlug   = JSON.parse(p.getProperty(LIVENESS_NOSLUG_PROP) || '[]');

  var checked = 0;

  for (var r = cursor; r < n; r++) {
    if (Date.now() - startTime > TIME_BUDGET_MS) {
      p.setProperty(LIVENESS_CURSOR_PROP, String(r));
      p.setProperty(LIVENESS_ARCHIVED_PROP, JSON.stringify(archived));
      p.setProperty(LIVENESS_NOSLUG_PROP, JSON.stringify(noSlug));
      Logger.log('Time budget hit at row ' + (r + 2) + ' — checked ' + checked + ' HC docs this run.');
      Logger.log('Re-run checkContentfulLiveness() to continue. Findings so far: ' +
                 archived.length + ' archived, ' + noSlug.length + ' without slug.');
      return;
    }

    var lane = String(lanes[r][0] || '').toUpperCase();
    if (lane !== 'HC') continue;

    var docId = String(docIds[r][0] || '').trim();
    if (!docId) continue;

    var fileName = String(fileNames[r][0] || '');
    checked++;

    var slug = '';
    try {
      var doc = DocumentApp.openById(docId);
      slug = extractSlugFromDoc_(doc);
    } catch (e) {
      noSlug.push(fileName + '  [doc unreadable: ' + e + ']');
      continue;
    }

    if (!slug) {
      noSlug.push(fileName + '  [no Slug: line in header]');
      continue;
    }

    var name = fetchContentfulNameBySlug_(slug);
    if (!name) {
      archived.push(fileName + '  [slug: ' + slug + ']');
    }

    Utilities.sleep(120);   // gentle pacing on Contentful
  }

  // COMPLETE — clear cursor, report everything.
  p.deleteProperty(LIVENESS_CURSOR_PROP);
  p.deleteProperty(LIVENESS_ARCHIVED_PROP);
  p.deleteProperty(LIVENESS_NOSLUG_PROP);

  Logger.log('=== Contentful liveness check COMPLETE ===');
  Logger.log('ARCHIVED / GONE from Contentful (' + archived.length + '):');
  archived.forEach(function (a) { Logger.log('  - ' + a); });
  Logger.log('');
  Logger.log('No slug in doc header (' + noSlug.length + ') — cannot verify these:');
  noSlug.forEach(function (s) { Logger.log('  - ' + s); });
  Logger.log('');
  Logger.log('NOTE: this was read-only. Nothing was modified anywhere.');
  Logger.log('Deletions are yours to do manually in the Drive, as always.');
}