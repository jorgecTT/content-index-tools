/**
 * ================================================================
 * Content Audit — Glossary Type Migration  (NEW FILE)
 * v1.0.0 — ONE-TIME MIGRATION, SAFE TO RE-RUN (idempotent)
 * ================================================================
 * Adds the 'type' column (7th, at the END — isolation-safe) to the
 * glossary_auto tab and seeds it for MANUAL rows only:
 *   product -> never translated (ES == EN)
 *   ui      -> interface labels/sections/actions (double rendering:
 *              common noun = direct translation; naming the section
 *              or button = English ("Español"))
 *   term    -> normal vocabulary, direct translation (default for
 *              every manual row not listed as product/ui)
 * AUTO rows are left EMPTY on purpose — they get classified
 * gradually by future audits. Empty type behaves as 'term'.
 *
 * Never deletes anything. glossary_auto tab ONLY.
 * Reuses CORPUS_SHEET_ID_LITERAL (CorpusSync.gs) and normalize_
 * (WebApp.gs). Requires WebApp v1.9.6 for the app to SERVE the
 * new column — run this migration FIRST, then deploy v1.9.6.
 * ================================================================ */

function runGlossaryTypeMigration() {
  var TAB = 'glossary_auto';
  var BASE_COLS = ['en', 'es', 'context', 'sourceArticle', 'dateAdded', 'status'];
  var TYPE_COL_INDEX = BASE_COLS.length + 1;   // column 7

  // EN terms that are PRODUCT names (never translated).
  var PRODUCT_TERMS = [
    'Front Desk',
    'Thumbtack Pay'
  ];

  // EN terms that are UI labels / sections / menu actions.
  var UI_TERMS = [
    'Account Settings',
    'Business Profile',
    'Change Password',
    'Close Account',
    'Contact Us',
    'Deactivate Account',
    'For you',
    'Manage lead prices',
    'Mark as Hired',
    'Notifications',
    'Open leads',
    'Pause Leads',
    'Portfolio',
    'Preload my balance',
    'Quick Replies',
    'Reactivate account',
    'Save',
    'Search Results',
    'Track my spending',
    'Turn On/Off Preferences',
    'View details',
    'Add new service',
    'Job Preferences',
    'Weekly Budget'
  ];

  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var sh = ss.getSheetByName(TAB);
  if (!sh || sh.getLastRow() < 2) {
    Logger.log('ERROR: glossary_auto tab is empty or missing.');
    return;
  }

  // ---- 1) Ensure the 'type' header exists in column 7 ----
  var header = sh.getRange(1, 1, 1, TYPE_COL_INDEX).getValues()[0];
  if (String(header[TYPE_COL_INDEX - 1] || '').trim() === '') {
    sh.getRange(1, TYPE_COL_INDEX).setValue('type');
    Logger.log('Header "type" created in column ' + TYPE_COL_INDEX + '.');
  } else if (String(header[TYPE_COL_INDEX - 1]).trim().toLowerCase() !== 'type') {
    Logger.log('ERROR: column ' + TYPE_COL_INDEX + ' already has a different header: "' +
               header[TYPE_COL_INDEX - 1] + '". Aborting to protect existing data.');
    return;
  }

  // ---- 2) Build lookup sets ----
  var productSet = {};
  PRODUCT_TERMS.forEach(function (t) { productSet[normalize_(t)] = true; });
  var uiSet = {};
  UI_TERMS.forEach(function (t) { uiSet[normalize_(t)] = true; });

  // ---- 3) Seed types for MANUAL rows only ----
  var n = sh.getLastRow() - 1;
  var data = sh.getRange(2, 1, n, TYPE_COL_INDEX).getValues();
  var iEn = 0, iSt = 5, iTy = TYPE_COL_INDEX - 1;

  var typeValues = [];   // one write at the end
  var counts = { product: 0, ui: 0, term: 0, autoLeftEmpty: 0, alreadySet: 0 };
  var uiList = [], productList = [];

  for (var r = 0; r < n; r++) {
    var current = String(data[r][iTy] || '').trim();
    if (current) {                              // idempotent: don't overwrite
      typeValues.push([current]);
      counts.alreadySet++;
      continue;
    }
    var status = String(data[r][iSt] || '').toLowerCase();
    if (status !== 'manual') {                  // autos & others stay empty
      typeValues.push(['']);
      counts.autoLeftEmpty++;
      continue;
    }
    var enN = normalize_(data[r][iEn]);
    var t;
    if (productSet[enN]) { t = 'product'; counts.product++; productList.push(data[r][iEn]); }
    else if (uiSet[enN]) { t = 'ui'; counts.ui++; uiList.push(data[r][iEn]); }
    else { t = 'term'; counts.term++; }
    typeValues.push([t]);
  }

  sh.getRange(2, TYPE_COL_INDEX, n, 1).setValues(typeValues);

  // ---- 4) Report ----
  Logger.log('=== GLOSSARY TYPE MIGRATION REPORT ===');
  Logger.log('product: ' + counts.product + '  -> ' + productList.join(', '));
  Logger.log('ui: ' + counts.ui + '  -> ' + uiList.join(', '));
  Logger.log('term (manual default): ' + counts.term);
  Logger.log('auto rows left empty (classified gradually): ' + counts.autoLeftEmpty);
  Logger.log('already set (skipped): ' + counts.alreadySet);
  Logger.log('---');
  Logger.log('Empty type = behaves as "term". Edit any cell by hand to reclassify.');
  Logger.log('NEXT: deploy WebApp v1.9.6 (pencil > New version) so the app serves the new column.');
}