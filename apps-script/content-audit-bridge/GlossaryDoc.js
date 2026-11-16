/* ================================================================
 * GlossaryDoc.gs  v1.1.0  (Nov 16, 2026)
 * v1.1.0: a decision can ADD a new approved Spanish (add: true) with its
 *         own context note; used for Thumbtack messenger (varies by context).
 * Content Audit Bridge
 *
 * Keeps ONE Google Doc with the approved EN -> ES glossary, plus the
 * rules for using it, so people outside the team (or a bot) can read
 * it without touching the real source.
 *
 * Source: the glossary_auto tab of the corpus sheet (the same data the
 * Localization Auditor app and the GitHub mirror use). This file only
 * READS that tab, except fixGlossaryForDoc(), a one-time cleanup.
 * Rejected and conflict rows are never written to the Doc.
 *
 * Functions to Run in the editor:
 *   fixGlossaryForDoc()          one-time cleanup (safe to run again)
 *   updateGlossaryDocNow()       rewrites the Doc right now, logs its link
 *   installGlossaryDocTrigger()  daily update ~9 AM Bogota (run once)
 *   glossaryDocCheck()           logs the Doc link, term count, trigger
 *
 * The daily trigger calls glossaryDocDaily(), which only rewrites the
 * Doc when the glossary actually changed.
 * ================================================================ */

var GLOSSARY_DOC_VERSION = '1.1.0';
var GLOSSARY_DOC_TITLE = 'Thumbtack Spanish glossary (approved, updates automatically)';
var GLOSSARY_DOC_PROP_ID = 'GLOSSARY_DOC_ID';
var GLOSSARY_DOC_PROP_HASH = 'GLOSSARY_DOC_HASH';
var GLOSSARY_DOC_CONTACT = 'Jorge Cardona (jcardona@thumbtack.com)';

// Decisions for the one-time cleanup. Winner = the Spanish that stays.
// Every other row with the same English term becomes "rejected" (kept as a
// blacklist, never deleted). add: true = create the winner row if it is new.
// context = replaces the context note of the winner.
var GLOSSARY_DOC_DECISIONS = [
  { en: 'Thumbtack Pro app', es: 'aplicación de Thumbtack Pro', type: 'term' },
  { en: 'Switch to business', es: 'Cambiar a cuenta de profesional', type: 'ui' },
  { en: 'Thumbtack messenger', es: 'chat de Thumbtack', type: 'term', add: true,
    context: "La herramienta para enviar y recibir mensajes en Thumbtack. Varía según el contexto: 'chat de Thumbtack' cuando se habla de la herramienta, 'mensajes de Thumbtack' cuando se habla de las conversaciones, 'mensajería de Thumbtack' cuando se habla del servicio en general. No usar 'mensajero'." }
];


/* ---------------- Functions to Run ---------------- */

function updateGlossaryDocNow() {
  var res = glossaryDocWrite_(true);
  Logger.log('Glossary Doc updated: ' + res.terms + ' terms. Link: ' + res.url);
  return res;
}

function glossaryDocDaily() {
  var res = glossaryDocWrite_(false);
  Logger.log(res.changed ? 'Glossary Doc rewritten (' + res.terms + ' terms).' : 'No glossary changes, Doc left as is.');
  return res;
}

function installGlossaryDocTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'glossaryDocDaily') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('glossaryDocDaily').timeBased().everyDays(1).atHour(9).create();
  Logger.log('Daily trigger installed: glossaryDocDaily, every day around 9 AM (project time zone).');
}

function glossaryDocCheck() {
  var id = PropertiesService.getScriptProperties().getProperty(GLOSSARY_DOC_PROP_ID);
  var terms = glossaryDocReadTerms_();
  var hasTrigger = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'glossaryDocDaily';
  });
  Logger.log('Doc: ' + (id ? 'https://docs.google.com/document/d/' + id + '/edit' : 'not created yet (run updateGlossaryDocNow)'));
  Logger.log('Approved terms that go in the Doc: ' + terms.length);
  Logger.log('Daily trigger: ' + (hasTrigger ? 'installed' : 'NOT installed (run installGlossaryDocTrigger)'));
}

function fixGlossaryForDoc() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var sh = ss.getSheetByName(GLOSSARY_TAB_NAME);
  if (!sh || sh.getLastRow() < 2) {
    Logger.log('glossary_auto tab is empty or missing. Nothing to fix.');
    return;
  }
  var iEn = GLOSSARY_COLUMNS.indexOf('en');
  var iEs = GLOSSARY_COLUMNS.indexOf('es');
  var iSt = GLOSSARY_COLUMNS.indexOf('status');
  var iTy = GLOSSARY_COLUMNS.indexOf('type');
  var n = sh.getLastRow() - 1;
  var vals = sh.getRange(2, 1, n, GLOSSARY_COLUMNS.length).getValues();
  var log = [];

  function isRejected(r) { return String(vals[r][iSt] || '').toLowerCase() === 'rejected'; }
  function setCell(r, col, value) {
    sh.getRange(r + 2, col + 1).setValue(value);
    vals[r][col] = value;
  }

  // 1) Spanish that repeats the English label: 'Save changes ("Guardar cambios")' -> 'Guardar cambios'
  for (var r = 0; r < n; r++) {
    if (isRejected(r)) continue;
    var en = String(vals[r][iEn] || '');
    var es = String(vals[r][iEs] || '');
    var clean = glossaryDocCleanEs_(en, es);
    if (clean === es) continue;
    var twin = false;
    for (var k = 0; k < n; k++) {
      if (k !== r && !isRejected(k) && normalize_(vals[k][iEn]) === normalize_(en) && normalize_(vals[k][iEs]) === normalize_(clean)) {
        twin = true;
        break;
      }
    }
    if (twin) {
      setCell(r, iSt, 'rejected');
      log.push('Row ' + (r + 2) + ' "' + en + '": duplicate of a clean row, marked rejected.');
    } else {
      setCell(r, iEs, clean);
      log.push('Row ' + (r + 2) + ' "' + en + '": "' + es + '" -> "' + clean + '"');
    }
  }

  // 2) Conflicts and missing types, using GLOSSARY_DOC_DECISIONS
  for (var d = 0; d < GLOSSARY_DOC_DECISIONS.length; d++) {
    var dec = GLOSSARY_DOC_DECISIONS[d];
    var group = [];
    var winner = -1;
    for (var g = 0; g < n; g++) {
      if (isRejected(g)) continue;
      if (normalize_(vals[g][iEn]) !== normalize_(dec.en)) continue;
      group.push(g);
      if (winner < 0 && normalize_(vals[g][iEs]) === normalize_(dec.es)) winner = g;
    }
    if (winner < 0 && dec.add) {
      var newRow = [];
      for (var nc = 0; nc < GLOSSARY_COLUMNS.length; nc++) newRow.push('');
      newRow[iEn] = dec.en;
      newRow[iEs] = dec.es;
      newRow[GLOSSARY_COLUMNS.indexOf('context')] = dec.context || '';
      newRow[GLOSSARY_COLUMNS.indexOf('sourceArticle')] = 'manual decision (Jorge Cardona)';
      newRow[GLOSSARY_COLUMNS.indexOf('dateAdded')] = new Date();
      newRow[iSt] = 'manual';
      newRow[iTy] = dec.type || 'term';
      sh.getRange(n + 2, 1, 1, GLOSSARY_COLUMNS.length).setValues([newRow]);
      vals.push(newRow);
      winner = n;
      n++;
      group.push(winner);
      log.push('"' + dec.en + '": added new approved row "' + dec.es + '".');
    }
    if (winner < 0) {
      log.push('SKIPPED "' + dec.en + '": no row with Spanish "' + dec.es + '". Nothing changed for this term.');
      continue;
    }
    for (var m = 0; m < group.length; m++) {
      var row = group[m];
      if (row === winner) {
        if (String(vals[row][iSt] || '').toLowerCase() !== 'manual') setCell(row, iSt, 'manual');
        if (dec.type && String(vals[row][iTy] || '') !== dec.type) setCell(row, iTy, dec.type);
        var iCxFix = GLOSSARY_COLUMNS.indexOf('context');
        if (dec.context && String(vals[row][iCxFix] || '') !== dec.context) setCell(row, iCxFix, dec.context);
      } else {
        setCell(row, iSt, 'rejected');
      }
    }
    log.push('"' + dec.en + '" -> "' + dec.es + '" approved (type ' + dec.type + '). Other versions: ' + (group.length - 1) + ' marked rejected.');
  }

  // 3) Anything still pending, so it is easy to see
  var pending = [];
  for (var p = 0; p < n; p++) {
    if (String(vals[p][iSt] || '').toLowerCase() === 'conflict') {
      pending.push('"' + vals[p][iEn] + '" = "' + vals[p][iEs] + '"');
    }
  }

  Logger.log('Changes made: ' + log.length);
  for (var x = 0; x < log.length; x++) Logger.log(log[x]);
  Logger.log(pending.length ? 'Still in conflict (left out of the Doc): ' + pending.join(', ') : 'No conflicts left.');
}


/* ---------------- Internals ---------------- */

// If the Spanish is "EnglishLabel ("Spanish")", keep only the Spanish.
function glossaryDocCleanEs_(en, es) {
  var m = String(es || '').match(/^(.*?)\s*\(\s*["\u201C\u201D](.+?)["\u201C\u201D]\s*\)\s*$/);
  if (m && normalize_(m[1].trim()) === normalize_(String(en || '').trim())) return m[2].trim();
  return String(es || '');
}

function glossaryDocReadTerms_() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var sh = ss.getSheetByName(GLOSSARY_TAB_NAME);
  if (!sh || sh.getLastRow() < 2) return [];
  var n = sh.getLastRow() - 1;
  var vals = sh.getRange(2, 1, n, GLOSSARY_COLUMNS.length).getValues();
  var iEn = GLOSSARY_COLUMNS.indexOf('en');
  var iEs = GLOSSARY_COLUMNS.indexOf('es');
  var iCx = GLOSSARY_COLUMNS.indexOf('context');
  var iSt = GLOSSARY_COLUMNS.indexOf('status');
  var iTy = GLOSSARY_COLUMNS.indexOf('type');
  var terms = [];
  for (var r = 0; r < n; r++) {
    var en = String(vals[r][iEn] || '').trim();
    var status = String(vals[r][iSt] || '').toLowerCase();
    if (!en || status === 'rejected' || status === 'conflict') continue;
    var type = String(vals[r][iTy] || '').toLowerCase();
    if (type !== 'product' && type !== 'ui') type = 'term';
    terms.push({
      en: en,
      es: glossaryDocCleanEs_(en, vals[r][iEs]).trim(),
      context: String(vals[r][iCx] || '').trim(),
      type: type
    });
  }
  terms.sort(function (a, b) {
    return a.en.toLowerCase().localeCompare(b.en.toLowerCase());
  });
  return terms;
}

function glossaryDocGet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(GLOSSARY_DOC_PROP_ID);
  if (id) {
    try {
      if (!DriveApp.getFileById(id).isTrashed()) return DocumentApp.openById(id);
    } catch (e) {
      // Doc gone or no access: create a new one below
    }
  }
  var doc = DocumentApp.create(GLOSSARY_DOC_TITLE);
  props.setProperty(GLOSSARY_DOC_PROP_ID, doc.getId());
  props.deleteProperty(GLOSSARY_DOC_PROP_HASH);
  return doc;
}

function glossaryDocWrite_(force) {
  var terms = glossaryDocReadTerms_();
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
    GLOSSARY_DOC_VERSION + JSON.stringify(terms), Utilities.Charset.UTF_8);
  var hash = Utilities.base64Encode(digest);
  var props = PropertiesService.getScriptProperties();
  var doc = glossaryDocGet_();
  var url = doc.getUrl();

  if (!force && props.getProperty(GLOSSARY_DOC_PROP_HASH) === hash) {
    return { changed: false, terms: terms.length, url: url };
  }

  var groups = { product: [], ui: [], term: [] };
  for (var i = 0; i < terms.length; i++) groups[terms[i].type].push(terms[i]);

  var P = DocumentApp.ParagraphHeading;
  var body = doc.getBody();
  body.clear();

  var first = body.getParagraphs()[0];
  first.setText(GLOSSARY_DOC_TITLE);
  first.setHeading(P.TITLE);

  body.appendParagraph('This is Thumbtack\'s approved English to Spanish (US) glossary. It updates automatically from the glossary the Field Enablement team maintains. Please don\'t edit this Doc: any change is overwritten on the next update. For questions or new terms, contact ' + GLOSSARY_DOC_CONTACT + '.');
  var tz = Session.getScriptTimeZone();
  body.appendParagraph('Last updated: ' + Utilities.formatDate(new Date(), tz, 'MMM d, yyyy') +
    '. Approved terms: ' + terms.length + ' (' + groups.product.length + ' product names, ' +
    groups.ui.length + ' app labels, ' + groups.term.length + ' terms).').editAsText().setItalic(true);

  body.appendParagraph('How to use this glossary').setHeading(P.HEADING1);
  var rules = [
    'Product names: never translate them. Keep the English name exactly as written, with no quotes or parentheses.',
    'App and website labels (buttons, tabs, menus, page names): when the text points to the label itself, write the English label first and the Spanish in parentheses and quotes. Example: Seleccione Payments ("Pagos"). When the same word is used as a normal word, just translate it.',
    'Terms: use the approved Spanish only when the word has the meaning described in its context note. The same English word with a different meaning can be translated differently.',
    'Words that are not in this glossary can be translated however reads best in context.',
    'Use "usted", never "tú".',
    'Write natural Spanish, not word for word. Don\'t add or remove information.',
    'Keep it simple and plain: short sentences, familiar words, no slang or regional expressions.',
    'Use sentence case in titles and headers (Cómo solicitar reseñas, not Cómo Solicitar Reseñas).',
    'Don\'t use em dashes. Use commas, periods or parentheses instead.'
  ];
  for (var r = 0; r < rules.length; r++) {
    body.appendListItem(rules[r]).setGlyphType(DocumentApp.GlyphType.BULLET);
  }

  glossaryDocSection_(body, 'Product names (keep in English)',
    'Always keep these exactly as written in English.',
    ['English', 'Use in Spanish', 'Context'],
    groups.product.map(function (t) { return [t.en, t.en, t.context]; }));

  glossaryDocSection_(body, 'App and website labels',
    'When you refer to the label, write it as: English label ("Spanish").',
    ['English label', 'Spanish', 'Context'],
    groups.ui.map(function (t) { return [t.en, t.es, t.context]; }));

  glossaryDocSection_(body, 'Terms',
    'Use the Spanish when the word has the meaning in the context note.',
    ['English', 'Spanish', 'Context'],
    groups.term.map(function (t) { return [t.en, t.es, t.context]; }));

  doc.saveAndClose();
  props.setProperty(GLOSSARY_DOC_PROP_HASH, hash);
  return { changed: true, terms: terms.length, url: url };
}

function glossaryDocSection_(body, title, note, header, rows) {
  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(note);
  if (!rows.length) {
    body.appendParagraph('No terms yet.');
    return;
  }
  var cells = [header].concat(rows.map(function (row) {
    return row.map(function (c) { return String(c || ''); });
  }));
  var table = body.appendTable(cells);
  var head = table.getRow(0);
  for (var c = 0; c < head.getNumCells(); c++) {
    head.getCell(c).setBackgroundColor('#eeeeee');
    head.getCell(c).editAsText().setBold(true);
  }
}
