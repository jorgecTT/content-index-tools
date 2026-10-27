/**
 * ================================================================
 * Content Audit — Reset Orphan In-Audit Rows  (NEW FILE)
 * v1.0.0
 * ================================================================
 * Lives in the SAME Apps Script project. Reuses TRACKER_TAB_NAME,
 * TRACKER_COLUMNS and CORPUS_SHEET_ID_LITERAL — do not redeclare.
 *
 * WHAT IT DOES:
 *   Finds every tracker row stuck in status "in_audit" and resets it
 *   to its automatic status:
 *     - "translated"     if the row has a docIdES
 *     - "not_translated" if it doesn't
 *   Also clears that row's startedDate. It does NOT touch auditedDate,
 *   accuracy, notes, or any other cell — and it never touches rows in
 *   any other status (audited rows are 100% safe).
 *
 *   Use it whenever an audit was started by accident and you want the
 *   row back to normal. Logs exactly what it changed.
 *
 *   NOTE: this resets ALL in_audit rows. If you are genuinely working
 *   on an audit right now, complete it first (or expect to press
 *   Start Audit again after running this).
 * ================================================================ */

function resetOrphanInAudit() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var tracker = ss.getSheetByName(TRACKER_TAB_NAME);
  if (!tracker || tracker.getLastRow() < 2) { Logger.log('Tracker vacío o no existe.'); return; }

  var n = tracker.getLastRow() - 1;
  var iKey = TRACKER_COLUMNS.indexOf('translationKey') + 1;
  var iTit = TRACKER_COLUMNS.indexOf('titleEN') + 1;
  var iEs  = TRACKER_COLUMNS.indexOf('docIdES') + 1;
  var iAud = TRACKER_COLUMNS.indexOf('audience') + 1;
  var iSt  = TRACKER_COLUMNS.indexOf('status') + 1;
  var iSd  = TRACKER_COLUMNS.indexOf('startedDate') + 1;

  var titles = tracker.getRange(2, iTit, n, 1).getValues();
  var esIds  = tracker.getRange(2, iEs,  n, 1).getValues();
  var auds   = tracker.getRange(2, iAud, n, 1).getValues();
  var stats  = tracker.getRange(2, iSt,  n, 1).getValues();

  var fixed = 0;
  for (var r = 0; r < n; r++) {
    if (String(stats[r][0] || '').trim().toLowerCase() !== 'in_audit') continue;

    var hasES = !!String(esIds[r][0] || '').trim();
    var newStatus = hasES ? 'translated' : 'not_translated';
    var rowIndex = r + 2;

    tracker.getRange(rowIndex, iSt).setValue(newStatus);
    tracker.getRange(rowIndex, iSd).setValue('');
    fixed++;

    Logger.log('Reset: "' + String(titles[r][0] || '') + '" (' + String(auds[r][0] || '') +
               ') -> ' + newStatus + ' (startedDate cleared)');
  }

  if (fixed === 0) {
    Logger.log('No in_audit rows found. Nothing to reset.');
  } else {
    Logger.log('Done — ' + fixed + ' row(s) reset. Refresh the dashboard to see it.');
  }
}