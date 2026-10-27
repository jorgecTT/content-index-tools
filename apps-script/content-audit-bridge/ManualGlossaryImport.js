/**
 * ================================================================
 * Content Audit — Manual Glossary Import  (NEW FILE, ONE-TIME)
 * v1.0.0
 * ================================================================
 * Lives in the SAME Apps Script project. Reuses normalize_,
 * GLOSSARY_TAB_NAME and GLOSSARY_COLUMNS from WebApp.gs (v1.9.1),
 * plus CORPUS_SHEET_ID_LITERAL from CorpusSync.gs — do not redeclare.
 *
 * WHAT IT DOES (one-time, safe to re-run):
 *   Reads Alex's MANUAL glossary sheet (Termino en Ingles | Termino en
 *   Espanol | Contexto) and imports every term into the 'glossary_auto'
 *   tab of the corpus Sheet with status='manual', preserving the
 *   context/explanation column.
 *
 *   Dedupe on re-run: a pair already present (same en + same es,
 *   case/accent-insensitive) is skipped. Same en with a DIFFERENT es
 *   is added as 'conflict' so it becomes visible.
 *
 *   READ-ONLY on the manual sheet. Writes ONLY to glossary_auto.
 *   The manual sheet keeps working exactly as before.
 *
 * HOW TO RUN:
 *   1) Make sure WebApp.gs is at v1.9.1 (GLOSSARY_COLUMNS includes
 *      'context') and any old glossary_auto tab without the context
 *      column has been deleted.
 *   2) Run importManualGlossaryOnce() and check the log.
 * ================================================================ */

var MANUAL_GLOSSARY_SHEET_ID = '1fJ3L1rh4eMIpOEnufV98NhOrqfgYprHArWEOCqgKcG4';
var MANUAL_GLOSSARY_GID = 1113586630;

function importManualGlossaryOnce() {
  // ---- 1) Read the manual glossary tab (by gid) ----
  var src = SpreadsheetApp.openById(MANUAL_GLOSSARY_SHEET_ID);
  var srcSheet = null;
  var sheets = src.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    if (sheets[s].getSheetId() === MANUAL_GLOSSARY_GID) { srcSheet = sheets[s]; break; }
  }
  if (!srcSheet) throw new Error('No encuentro la hoja con gid ' + MANUAL_GLOSSARY_GID + ' en el glosario manual.');

  var data = srcSheet.getDataRange().getValues();
  if (data.length < 2) { Logger.log('Glosario manual vacío.'); return; }

  // Detect the header row: find the row containing "Término en Inglés".
  var startRow = -1, cEn = -1, cEs = -1, cCtx = -1;
  for (var h = 0; h < Math.min(5, data.length); h++) {
    for (var c = 0; c < data[h].length; c++) {
      var cell = String(data[h][c] || '').toLowerCase();
      if (cell.indexOf('ingl') !== -1) { cEn = c; startRow = h + 1; }
      if (cell.indexOf('espa') !== -1) { cEs = c; }
      if (cell.indexOf('context') !== -1 || cell.indexOf('descrip') !== -1) { cCtx = c; }
    }
    if (startRow !== -1) break;
  }
  if (startRow === -1 || cEn === -1 || cEs === -1) {
    throw new Error('Headers no encontrados (Termino en Ingles / Termino en Espanol). Revisa el sheet.');
  }

  // ---- 2) Open/create the glossary_auto tab ----
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var sh = ss.getSheetByName(GLOSSARY_TAB_NAME);
  if (!sh) {
    sh = ss.insertSheet(GLOSSARY_TAB_NAME);
    sh.getRange(1, 1, 1, GLOSSARY_COLUMNS.length).setValues([GLOSSARY_COLUMNS]);
    sh.setFrozenRows(1);
  }

  // Sanity check: the tab must have the v1.9.1 schema (with 'context').
  var hdr = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), GLOSSARY_COLUMNS.length)).getValues()[0].map(String);
  if (hdr.indexOf('context') === -1) {
    throw new Error('El tab glossary_auto no tiene la columna context. Actualiza WebApp.gs a v1.9.1 y borra el tab viejo primero.');
  }

  // ---- 3) Load existing pairs for dedupe ----
  var iEn = GLOSSARY_COLUMNS.indexOf('en');
  var iEs = GLOSSARY_COLUMNS.indexOf('es');
  var existing = {};   // norm(en) -> { norm(es): true }
  var last = sh.getLastRow();
  if (last > 1) {
    var vals = sh.getRange(2, 1, last - 1, GLOSSARY_COLUMNS.length).getValues();
    for (var r = 0; r < vals.length; r++) {
      var enN = normalize_(vals[r][iEn]);
      var esN = normalize_(vals[r][iEs]);
      if (!enN) continue;
      if (!existing[enN]) existing[enN] = {};
      existing[enN][esN] = true;
    }
  }

  // ---- 4) Build rows in memory ----
  var now = new Date().toISOString().slice(0, 10);
  var newRows = [];
  var added = 0, conflicts = 0, skipped = 0;

  for (var d = startRow; d < data.length; d++) {
    var en = String(data[d][cEn] || '').trim();
    var es = String(data[d][cEs] || '').trim();
    var ctx = (cCtx !== -1) ? String(data[d][cCtx] || '').trim() : '';
    if (!en || !es) { if (en || es) skipped++; continue; }

    var enN2 = normalize_(en);
    var esN2 = normalize_(es);

    if (existing[enN2] && existing[enN2][esN2]) { skipped++; continue; }

    var status = 'manual';
    if (existing[enN2]) { status = 'conflict'; conflicts++; }
    else { added++; }

    // Row order must follow GLOSSARY_COLUMNS: en, es, context, sourceArticle, dateAdded, status
    newRows.push([en, es, ctx, 'manual glossary import', now, status]);

    if (!existing[enN2]) existing[enN2] = {};
    existing[enN2][esN2] = true;
  }

  // ---- 5) ONE write ----
  if (newRows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, newRows.length, GLOSSARY_COLUMNS.length).setValues(newRows);
  }

  Logger.log('Manual glossary import done.');
  Logger.log('  imported as manual: ' + added + ', conflicts: ' + conflicts + ', skipped (dupes/empty): ' + skipped);
  if (conflicts > 0) {
    Logger.log('  Revisa las filas status=conflict en glossary_auto — mismo termino EN con otra traduccion.');
  }
}