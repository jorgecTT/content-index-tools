/**
 * ================================================================
 * Content Audit — Slug Lookup  (NEW FILE, DIAGNOSTIC, READ-ONLY)
 * v1.0.0
 * ================================================================
 * Lives in the SAME Apps Script project as CorpusSync.gs.
 * Reuses COLUMNS, getSheet_, extractSlugFromDoc_,
 * fetchContentfulNameBySlug_ and translationKeyFromName_ from
 * CorpusSync.gs — do not redeclare them here.
 *
 * WHAT IT DOES (READ-ONLY — writes NOTHING anywhere):
 *   For each title fragment below, finds the matching HC rows in the
 *   corpus, opens each Google Doc, reads the "Slug:" line from its page
 *   header, asks Contentful for the current article name, and logs:
 *   fileName + current slug + Contentful name + translationKey.
 *   With that we know exactly how to match these articles in the
 *   tracker (and what changed if a slug/name was renamed).
 * ================================================================ */

function lookupSlugsForAuditedArticles() {
  // Title fragments to look for (case/accent-insensitive, matches ES or EN docs).
  var LOOKFOR = [
    'solicitar un pago',
    'primeras dos semanas',
    'elegir Thumbtack',
    'solicitar un reembolso'
  ];

  var sheet = getSheet_();
  var n = sheet.getLastRow() - 1;
  if (n < 1) { Logger.log('Corpus vacío.'); return; }

  var col = function (name) { return COLUMNS.indexOf(name) + 1; };
  var docIds    = sheet.getRange(2, col('docId'),    n, 1).getValues();
  var fileNames = sheet.getRange(2, col('fileName'), n, 1).getValues();
  var lanes     = sheet.getRange(2, col('lane'),     n, 1).getValues();

  var norm = function (s) {
    var str = String(s || '').toLowerCase();
    if (str.normalize) str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return str;
  };

  var found = 0;

  for (var r = 0; r < n; r++) {
    if (String(lanes[r][0] || '').toUpperCase() !== 'HC') continue;

    var fileName = String(fileNames[r][0] || '');
    var fnNorm = norm(fileName);

    var matches = false;
    for (var t = 0; t < LOOKFOR.length; t++) {
      if (fnNorm.indexOf(norm(LOOKFOR[t])) !== -1) { matches = true; break; }
    }
    if (!matches) continue;

    found++;
    var docId = String(docIds[r][0] || '').trim();
    Logger.log('=== ' + fileName + ' ===');
    Logger.log('    docId: ' + docId);

    var slug = '';
    try {
      var doc = DocumentApp.openById(docId);
      slug = extractSlugFromDoc_(doc);
    } catch (e) {
      Logger.log('    ERROR opening doc: ' + e);
      continue;
    }

    if (!slug) {
      Logger.log('    slug: (none found in doc header)');
      continue;
    }
    Logger.log('    slug: ' + slug);

    var name = fetchContentfulNameBySlug_(slug);
    if (!name) {
      Logger.log('    Contentful: slug does NOT resolve (archived or renamed)');
    } else {
      Logger.log('    Contentful name: ' + name);
      Logger.log('    translationKey: ' + translationKeyFromName_(name));
    }

    Utilities.sleep(150);   // gentle pacing on Contentful
  }

  if (found === 0) {
    Logger.log('No HC docs matched any of the title fragments. Check the LOOKFOR list.');
  } else {
    Logger.log('Done — inspected ' + found + ' docs. Nothing was modified anywhere.');
  }
}