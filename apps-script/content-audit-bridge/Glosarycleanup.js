/**
 * ================================================================
 * Content Audit — Glossary Cleanup  (NEW FILE)
 * v1.0.0 — ONE-TIME CLEANUP, SAFE TO RE-RUN (idempotent)
 * ================================================================
 * Cleans the manual-import rows in the glossary_auto tab so every
 * row follows the convention: PURE term in 'es', presentation rules
 * and alternatives in 'context'.
 *
 * What it does (glossary_auto tab ONLY — never touches corpus/tracker):
 *   - EDITS: fixes 8 rows in place (es/context, one EN typo).
 *   - REJECTS: marks 3 template/double rows as status 'rejected'
 *     (kept as blacklist — NOTHING is ever deleted).
 *   - ADDS: appends 4 clean replacement rows as status 'manual'
 *     (with dedupe, so re-running never duplicates).
 *
 * Decisions encoded here (evidence: corpus usage, July 2026):
 *   Guidelines -> "Pautas" (corpus uses it; 'directrices' unused)
 *   Rank/Ranking -> split into two rows
 *   Insights -> "información" (corpus usage; NOT 'Panel de Control')
 *   Right to... -> rejected (unmatchable template)
 *   Product names (Thumbtack Pay, Top Pro) -> stay in English
 *
 * NOT included on purpose: the manual "Front Desk" row — fixing it
 * would silently resolve conflict group #1, and conflict resolution
 * is a separate, manual decision.
 *
 * Reuses from the project: CORPUS_SHEET_ID_LITERAL (CorpusSync.gs),
 * GLOSSARY_TAB_NAME + GLOSSARY_COLUMNS (WebApp.gs).
 * ================================================================ */

function runGlossaryCleanup() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var sh = ss.getSheetByName(GLOSSARY_TAB_NAME);
  if (!sh || sh.getLastRow() < 2) {
    Logger.log('ERROR: glossary_auto tab is empty or missing. Nothing to clean.');
    return;
  }

  // ---- The cleanup plan -------------------------------------------------

  // 1) In-place edits. Matched by CURRENT (en, es); writes new values.
  var EDITS = [
    {
      matchEn: 'Pro App', matchEs: 'Aplicación para Profesionales',
      newEs: 'aplicación Thumbtack Pro',
      newContext: "Nombre de la app móvil para profesionales. 'Thumbtack Pro' no se traduce."
    },
    {
      matchEn: 'Thumbtack Pay', matchEs: 'Pagos de Thumbtack',
      newEs: 'Thumbtack Pay',
      newContext: 'Sistema de procesamiento de pagos — nombre de producto, no se traduce.'
    },
    {
      matchEn: 'Top Pro Badge', matchEs: 'Insignia de Profesional Destacado ("Top Pro")',
      newEs: 'insignia de Top Pro',
      newContext: "'Top Pro' es el nombre del programa y no se traduce."
    },
    {
      matchEn: 'Add-ons', matchEs: 'Servicios Adicionales / Extras',
      newEs: 'Servicios adicionales',
      newContext: "Servicios opcionales con costo extra. Alternativa coloquial: 'extras'."
    },
    {
      matchEn: 'Guidelines', matchEs: 'Directrices / Pautas',
      newEs: 'Pautas',
      newContext: "Reglas y recomendaciones de la plataforma. El corpus usa 'pautas'; evitar 'directrices'."
    },
    {
      matchEn: 'Starting Price', matchEs: 'Precio Inicial / "Desde"',
      newEs: 'Precio inicial',
      newContext: "Precio base visible en resultados de búsqueda; la UI del buscador muestra 'Desde'."
    },
    {
      matchEn: 'Tab', matchEs: 'Seleccione',
      newEn: 'Tap',                                    // fixes the EN typo
      newEs: 'Seleccione',
      newContext: "Verbo para pasos en la app móvil: Tap X = Seleccione X. En Desktop: 'Haga clic en'."
    },
    {
      matchEn: 'Insights', matchEs: 'Panel de Control',
      newEs: 'información',
      newContext: 'lead insights = información de prospectos; competition insights = información sobre la competencia. No confundir con Performance Dashboard (Panel de Rendimiento).'
    }
  ];

  // 2) Rows to mark as rejected (kept as blacklist; replaced by ADDS below).
  var REJECTS = [
    { matchEn: 'Rank / Ranking', matchEs: 'Clasificación / Posición' },
    { matchEn: 'Contact Us / Support', matchEs: 'Contáctanos / Soporte' },
    { matchEn: 'Right to...', matchEs: 'Derecho a...' }
  ];

  // 3) Clean replacement rows (status 'manual').
  var ADDS = [
    { en: 'Rank', es: 'posición',
      context: 'Su posición en los resultados de búsqueda.' },
    { en: 'Ranking', es: 'clasificación',
      context: 'El ordenamiento de profesionales en los resultados de búsqueda.' },
    { en: 'Contact Us', es: 'Contáctanos',
      context: 'Botón/enlace de UI para contactar al equipo de soporte.' },
    { en: 'Support', es: 'Soporte',
      context: 'El equipo/área de atención al cliente.' }
  ];

  // ---- Load the tab once ------------------------------------------------
  var iEn = GLOSSARY_COLUMNS.indexOf('en');
  var iEs = GLOSSARY_COLUMNS.indexOf('es');
  var iCtx = GLOSSARY_COLUMNS.indexOf('context');
  var iSt = GLOSSARY_COLUMNS.indexOf('status');

  var n = sh.getLastRow() - 1;
  var vals = sh.getRange(2, 1, n, GLOSSARY_COLUMNS.length).getValues();

  // Loose matcher: accent/case-insensitive + ignores quote style and
  // extra spaces, so typographic quotes in the sheet still match.
  function normLoose(s) {
    var str = normalize_(s);
    return str.replace(/["\u201C\u201D\u2018\u2019']/g, '').replace(/\s+/g, ' ').trim();
  }

  function findRow(en, es) {
    var wantEn = normLoose(en), wantEs = normLoose(es);
    for (var r = 0; r < n; r++) {
      if (normLoose(vals[r][iEn]) === wantEn && normLoose(vals[r][iEs]) === wantEs) {
        return r;   // 0-based index into vals; sheet row = r + 2
      }
    }
    return -1;
  }

  var log = [];
  var edited = 0, rejected = 0, added = 0, skipped = 0, notFound = 0;

  // ---- Apply EDITS -------------------------------------------------------
  EDITS.forEach(function (e) {
    var r = findRow(e.matchEn, e.matchEs);
    if (r === -1) {
      // Already fixed on a previous run? Check by the NEW value.
      var already = findRow(e.newEn || e.matchEn, e.newEs);
      if (already !== -1) {
        log.push('SKIP (already clean): ' + e.matchEn);
        skipped++;
      } else {
        log.push('NOT FOUND: "' + e.matchEn + '" / "' + e.matchEs + '" — verify the row text.');
        notFound++;
      }
      return;
    }
    var row = r + 2;
    if (e.newEn) sh.getRange(row, iEn + 1).setValue(e.newEn);
    sh.getRange(row, iEs + 1).setValue(e.newEs);
    sh.getRange(row, iCtx + 1).setValue(e.newContext);
    vals[r][iEn] = e.newEn || vals[r][iEn];   // keep the in-memory copy current
    vals[r][iEs] = e.newEs;
    log.push('EDITED [fila ' + row + ']: ' + (e.newEn || e.matchEn) + ' -> "' + e.newEs + '"');
    edited++;
  });

  // ---- Apply REJECTS -----------------------------------------------------
  REJECTS.forEach(function (x) {
    var r = findRow(x.matchEn, x.matchEs);
    if (r === -1) {
      log.push('REJECT NOT FOUND (¿ya procesada?): ' + x.matchEn);
      notFound++;
      return;
    }
    var row = r + 2;
    var cur = String(vals[r][iSt] || '').toLowerCase();
    if (cur === 'rejected') {
      log.push('SKIP (already rejected): ' + x.matchEn);
      skipped++;
      return;
    }
    sh.getRange(row, iSt + 1).setValue('rejected');
    vals[r][iSt] = 'rejected';
    log.push('REJECTED [fila ' + row + ']: ' + x.matchEn + ' (replaced by split rows)');
    rejected++;
  });

  // ---- Apply ADDS (with dedupe) ------------------------------------------
  var now = new Date().toISOString().slice(0, 10);
  var newRows = [];
  ADDS.forEach(function (a) {
    if (findRow(a.en, a.es) !== -1) {
      log.push('SKIP ADD (already exists): ' + a.en + ' -> ' + a.es);
      skipped++;
      return;
    }
    var rowArr = [];
    rowArr[iEn] = a.en;
    rowArr[iEs] = a.es;
    rowArr[iCtx] = a.context;
    rowArr[GLOSSARY_COLUMNS.indexOf('sourceArticle')] = 'glossary cleanup';
    rowArr[GLOSSARY_COLUMNS.indexOf('dateAdded')] = now;
    rowArr[iSt] = 'manual';
    for (var c = 0; c < GLOSSARY_COLUMNS.length; c++) {
      if (rowArr[c] === undefined) rowArr[c] = '';
    }
    newRows.push(rowArr);
    log.push('ADDED: ' + a.en + ' -> ' + a.es + ' (manual)');
    added++;
  });
  if (newRows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, newRows.length, GLOSSARY_COLUMNS.length).setValues(newRows);
  }

  // ---- Report -------------------------------------------------------------
  Logger.log('=== GLOSSARY CLEANUP REPORT ===');
  log.forEach(function (l) { Logger.log(l); });
  Logger.log('---');
  Logger.log('Edited: ' + edited + ' | Rejected: ' + rejected + ' | Added: ' + added +
             ' | Skipped: ' + skipped + ' | Not found: ' + notFound);
  if (notFound > 0) {
    Logger.log('ATENCIÓN: hay filas NOT FOUND — el texto en la celda no coincide con lo esperado. Revísalas a mano.');
  }
  Logger.log('Recuerda: el sheet FUENTE del glosario manual no fue tocado (edítalo a mano si quieres mantenerlo alineado; ahí sigue el duplicado de "Job Preferences").');
}