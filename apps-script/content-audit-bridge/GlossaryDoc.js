/* ================================================================
 * GlossaryDoc.gs  v2.1.0  (Nov 19, 2026)
 * Content Audit Bridge
 *
 * Publishes the approved EN -> ES glossary for people outside the team
 * (and for Rachel's bot) in two places that update themselves:
 *   - a Google Doc (the one shared on Nov 16, GLOSSARY_DOC_FIXED_ID)
 *   - a Google Sheet (created on the first run, downloadable as Excel)
 *
 * Sources (corpus sheet):
 *   glossary_auto   English, Spanish, Spanish context, status, type
 *                   (same data as the Localization Auditor app)
 *   glossary_extra  per term: kind, how to write it in the app,
 *                   variations, do not use, English context
 * Rejected and conflict rows never reach the Doc or the Sheet.
 *
 * v2.1.0: Read me says how strict each type is (product names and app
 *         labels exact, terms when the meaning matches) and explains Tap vs
 *         Click. UI candidates skip Spanish Contentful articles and segments,
 *         and only keep bold text that comes right after Tap / Click /
 *         Select (and similar), so section titles and emphasis stay out.
 *         Candidates that are Spanish text are dropped. If an "In the app"
 *         label no longer matches the term's Spanish, the glossary_extra row
 *         gets needsReview = yes.
 *         WARNING: don't run applyFinalGlossary() again, it reloads the
 *         Nov 16 review and undoes later edits in glossary_extra.
 * v2.0.0: applyFinalGlossary() loads Jorge's full review (GlossaryData.gs,
 *         449 terms); Doc + Sheet with app labels, variations, do-not-use;
 *         new terms without English context get it auto-translated and
 *         flagged; weekly UI-label candidates (Spanish articles + bold text
 *         in English Help Center articles) in the glossary_ui_candidates tab.
 *
 * Functions to Run in the editor:
 *   applyFinalGlossary()         one time: loads the review (safe to run again)
 *   updateGlossaryNow()          rewrites the Doc and the Sheet now, logs links
 *   refreshUiCandidates()        finds new UI labels to approve (also weekly)
 *   installGlossaryDocTrigger()  daily update + weekly candidates (run once)
 *   glossaryDocCheck()           logs links, term count, triggers
 * ================================================================ */

var GLOSSARY_DOC_VERSION = '2.1.0';
var GLOSSARY_DOC_FIXED_ID = '13Q6onYfCxvX6WxzefPAkS1oionvqWCdB5Q5HxPqRa7k';
var GLOSSARY_DOC_TITLE = 'Thumbtack Spanish glossary (approved, updates automatically)';
var GLOSSARY_DOC_PROP_ID = 'GLOSSARY_DOC_ID';
var GLOSSARY_SHEET_PROP_ID = 'GLOSSARY_SHEET_ID';
var GLOSSARY_DOC_PROP_HASH = 'GLOSSARY_DOC_HASH';
var GLOSSARY_DOC_CONTACT = 'Jorge Cardona (jcardona@thumbtack.com)';
var GLOSSARY_EXTRA_TAB = 'glossary_extra';
var GLOSSARY_EXTRA_COLUMNS = ['en', 'kind', 'app', 'variations', 'doNotUse', 'contextEn', 'needsReview'];
var GLOSSARY_CAND_TAB = 'glossary_ui_candidates';
var GLOSSARY_CF_BASE = 'https://cdn.contentful.com/spaces/zkjkphkd3oqx/environments/master';
var GLOSSARY_CF_TOKEN = 'wYRv1oJP9HTiR8n_YD_qcdIrJBCPv1bBkOIscTmOSWE';
var GLOSSARY_KIND_LABEL = {
  product: 'Product name (keep in English)',
  ui: 'App label (UI)',
  term: 'Term',
  category: 'Service category'
};


/* ---------------- Functions to Run ---------------- */

function applyFinalGlossary() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var sh = ss.getSheetByName(GLOSSARY_TAB_NAME);
  if (!sh) throw new Error('glossary_auto tab is missing.');
  var C = GLOSSARY_COLUMNS;
  var iEn = C.indexOf('en'), iEs = C.indexOf('es'), iCx = C.indexOf('context');
  var iSrc = C.indexOf('sourceArticle'), iDt = C.indexOf('dateAdded');
  var iSt = C.indexOf('status'), iTy = C.indexOf('type');
  var n = Math.max(sh.getLastRow() - 1, 0);
  var vals = n ? sh.getRange(2, 1, n, C.length).getValues() : [];

  var index = {};
  for (var r = 0; r < vals.length; r++) {
    if (String(vals[r][iSt] || '').toLowerCase() === 'rejected') continue;
    var key = normalize_(String(vals[r][iEn] || '').trim());
    if (!key) continue;
    (index[key] = index[key] || []).push(r);
  }

  var updated = 0, added = 0, rejected = 0, unchanged = 0;
  var newRows = [];
  for (var i = 0; i < GLOSSARY_FINAL.length; i++) {
    var f = GLOSSARY_FINAL[i];
    var type = f.k === 'category' ? 'term' : f.k;
    var rows = index[normalize_(f.en)] || [];
    if (!rows.length) {
      var row = [];
      for (var c = 0; c < C.length; c++) row.push('');
      row[iEn] = f.en; row[iEs] = f.es; row[iCx] = f.cxEs;
      row[iSrc] = 'final glossary review (Jorge Cardona)'; row[iDt] = new Date();
      row[iSt] = 'manual'; row[iTy] = type;
      newRows.push(row);
      added++;
      continue;
    }
    var winner = rows[0];
    for (var w = 0; w < rows.length; w++) {
      if (normalize_(vals[rows[w]][iEs]) === normalize_(f.es)) { winner = rows[w]; break; }
    }
    var v = vals[winner];
    var changed = v[iEs] !== f.es || v[iCx] !== f.cxEs || v[iTy] !== type || String(v[iSt]).toLowerCase() !== 'manual';
    v[iEs] = f.es; v[iCx] = f.cxEs; v[iTy] = type; v[iSt] = 'manual';
    if (changed) updated++; else unchanged++;
    for (var o = 0; o < rows.length; o++) {
      if (rows[o] !== winner) { vals[rows[o]][iSt] = 'rejected'; rejected++; }
    }
  }
  for (var x = 0; x < GLOSSARY_FINAL_REMOVE.length; x++) {
    var rm = index[normalize_(GLOSSARY_FINAL_REMOVE[x])] || [];
    for (var y = 0; y < rm.length; y++) {
      if (String(vals[rm[y]][iSt]).toLowerCase() !== 'rejected') { vals[rm[y]][iSt] = 'rejected'; rejected++; }
    }
  }

  if (vals.length) sh.getRange(2, 1, vals.length, C.length).setValues(vals);
  if (newRows.length) sh.getRange(vals.length + 2, 1, newRows.length, C.length).setValues(newRows);

  var extra = ss.getSheetByName(GLOSSARY_EXTRA_TAB) || ss.insertSheet(GLOSSARY_EXTRA_TAB);
  extra.clearContents();
  var out = [GLOSSARY_EXTRA_COLUMNS];
  for (var e = 0; e < GLOSSARY_FINAL.length; e++) {
    var g = GLOSSARY_FINAL[e];
    out.push([g.en, g.k, g.app, g.var, g.dont, g.cxEn, '']);
  }
  extra.getRange(1, 1, out.length, GLOSSARY_EXTRA_COLUMNS.length).setValues(out);
  extra.setFrozenRows(1);

  Logger.log('Glossary review applied. Updated: ' + updated + ', added: ' + added +
    ', already right: ' + unchanged + ', other versions marked rejected: ' + rejected + '.');
  Logger.log('glossary_extra tab written with ' + (out.length - 1) + ' terms.');
}

function updateGlossaryNow() {
  var res = glossaryPublish_(true);
  Logger.log('Glossary updated: ' + res.terms + ' terms.');
  Logger.log('Doc: ' + res.docUrl);
  Logger.log('Sheet: ' + res.sheetUrl);
  if (res.staleApp) Logger.log('App labels to check (glossary_extra, needsReview = yes): ' + res.staleApp);
  if (res.autoTranslated) Logger.log('New terms with English context auto-translated (check glossary_extra, needsReview = yes): ' + res.autoTranslated);
  return res;
}

// Kept so an older trigger or habit still works.
function updateGlossaryDocNow() { return updateGlossaryNow(); }

function glossaryDocDaily() {
  var res = glossaryPublish_(false);
  Logger.log(res.changed ? 'Glossary Doc and Sheet rewritten (' + res.terms + ' terms).' : 'No glossary changes, left as is.');
  return res;
}

function installGlossaryDocTrigger() {
  var names = ['glossaryDocDaily', 'refreshUiCandidates'];
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (names.indexOf(triggers[i].getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger('glossaryDocDaily').timeBased().everyDays(1).atHour(9).create();
  ScriptApp.newTrigger('refreshUiCandidates').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(10).create();
  Logger.log('Triggers installed: glossaryDocDaily every day ~9 AM, refreshUiCandidates every Monday ~10 AM.');
}

function glossaryDocCheck() {
  var props = PropertiesService.getScriptProperties();
  var docId = props.getProperty(GLOSSARY_DOC_PROP_ID) || GLOSSARY_DOC_FIXED_ID;
  var sheetId = props.getProperty(GLOSSARY_SHEET_PROP_ID);
  var handlers = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  Logger.log('Doc: https://docs.google.com/document/d/' + docId + '/edit');
  Logger.log('Sheet: ' + (sheetId ? 'https://docs.google.com/spreadsheets/d/' + sheetId + '/edit' : 'not created yet (run updateGlossaryNow)'));
  Logger.log('Approved terms: ' + glossaryDocReadTerms_().length);
  var ex = glossaryReadExtra_().map, nr = [];
  Object.keys(ex).forEach(function (k) { if (String(ex[k].needsReview).toLowerCase() === 'yes') nr.push(ex[k].en); });
  Logger.log('glossary_extra rows to review (needsReview = yes): ' + (nr.length ? nr.join(', ') : 'none'));
  Logger.log('Daily trigger: ' + (handlers.indexOf('glossaryDocDaily') !== -1 ? 'installed' : 'NOT installed'));
  Logger.log('Weekly candidates trigger: ' + (handlers.indexOf('refreshUiCandidates') !== -1 ? 'installed' : 'NOT installed'));
}


/* ---------------- Reading the glossary ---------------- */

// If the Spanish is "EnglishLabel ("Spanish")", keep only the Spanish.
function glossaryDocCleanEs_(en, es) {
  var m = String(es || '').match(/^(.*?)\s*\(\s*["\u201C\u201D](.+?)["\u201C\u201D]\s*\)\s*$/);
  if (m && normalize_(m[1].trim()) === normalize_(String(en || '').trim())) return m[2].trim();
  return String(es || '');
}

function glossaryReadExtra_() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var sh = ss.getSheetByName(GLOSSARY_EXTRA_TAB);
  var map = {};
  if (!sh || sh.getLastRow() < 2) return { sheet: sh, map: map };
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, GLOSSARY_EXTRA_COLUMNS.length).getValues();
  for (var r = 0; r < vals.length; r++) {
    var o = {};
    for (var c = 0; c < GLOSSARY_EXTRA_COLUMNS.length; c++) o[GLOSSARY_EXTRA_COLUMNS[c]] = String(vals[r][c] || '');
    o._row = r + 2;
    if (o.en) map[normalize_(o.en.trim())] = o;
  }
  return { sheet: sh, map: map };
}

function glossaryDocReadTerms_() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var sh = ss.getSheetByName(GLOSSARY_TAB_NAME);
  if (!sh || sh.getLastRow() < 2) return [];
  var C = GLOSSARY_COLUMNS;
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, C.length).getValues();
  var iEn = C.indexOf('en'), iEs = C.indexOf('es'), iCx = C.indexOf('context');
  var iSt = C.indexOf('status'), iTy = C.indexOf('type');
  var extra = glossaryReadExtra_();
  var newExtra = [];
  var staleRows = [];
  var seen = {};
  var terms = [];
  for (var r = 0; r < vals.length; r++) {
    var en = String(vals[r][iEn] || '').trim();
    var status = String(vals[r][iSt] || '').toLowerCase();
    if (!en || status === 'rejected' || status === 'conflict') continue;
    var key = normalize_(en);
    if (seen[key]) continue;
    seen[key] = true;
    var es = glossaryDocCleanEs_(en, vals[r][iEs]).trim();
    var cxEs = String(vals[r][iCx] || '').trim();
    var type = String(vals[r][iTy] || '').toLowerCase();
    if (type !== 'product' && type !== 'ui') type = 'term';
    var x = extra.map[key];
    if (!x) {
      // New term added after the review: fill what we can and flag it
      var cxEn = '';
      try { cxEn = cxEs ? LanguageApp.translate(cxEs, 'es', 'en') : ''; } catch (e) { cxEn = ''; }
      x = { en: en, kind: type, app: type === 'ui' ? en + ' (\u201C' + es + '\u201D)' : '',
            variations: '', doNotUse: '', contextEn: cxEn, needsReview: 'yes' };
      newExtra.push([x.en, x.kind, x.app, x.variations, x.doNotUse, x.contextEn, x.needsReview]);
    }
    // v2.1.0: flag an "In the app" label whose Spanish no longer matches the term
    var appEs = String(x.app || '').match(/[\u201C"]([^\u201D"]+)[\u201D"]\s*\)?\s*$/);
    if (x._row && appEs && normalize_(appEs[1].trim()) !== normalize_(es) &&
        String(x.needsReview || '').toLowerCase() !== 'yes') {
      staleRows.push(x._row);
      x.needsReview = 'yes';
    }
    var kind = x.kind || type;
    terms.push({
      kind: GLOSSARY_KIND_LABEL[kind] ? kind : type,
      en: en, es: es, app: x.app, variations: x.variations, doNotUse: x.doNotUse,
      cxEn: x.contextEn, cxEs: cxEs
    });
  }
  if (newExtra.length) {
    var sh2 = extra.sheet || ss.insertSheet(GLOSSARY_EXTRA_TAB);
    if (sh2.getLastRow() === 0) sh2.appendRow(GLOSSARY_EXTRA_COLUMNS);
    sh2.getRange(sh2.getLastRow() + 1, 1, newExtra.length, GLOSSARY_EXTRA_COLUMNS.length).setValues(newExtra);
  }
  if (staleRows.length && extra.sheet) {
    var iNr = GLOSSARY_EXTRA_COLUMNS.indexOf('needsReview') + 1;
    for (var sr = 0; sr < staleRows.length; sr++) extra.sheet.getRange(staleRows[sr], iNr).setValue('yes');
    Logger.log('App labels that no longer match the Spanish (needsReview = yes): rows ' + staleRows.join(', '));
  }
  var order = { product: 0, ui: 1, term: 2, category: 3 };
  terms.sort(function (a, b) {
    return (order[a.kind] - order[b.kind]) || a.en.toLowerCase().localeCompare(b.en.toLowerCase());
  });
  terms.autoTranslated = newExtra.length;
  terms.staleApp = staleRows.length;
  return terms;
}


/* ---------------- Publishing ---------------- */

var GLOSSARY_READ_ME = [
  'Type: Product name = never translate, keep the English exactly, no quotes or parentheses. App label (UI) = a button, tab or menu in the app. Term = a word Thumbtack uses in a specific way. Service category = the name of a type of service.',
  'How strict: Product names and App labels must be used exactly as written. Terms are not word for word: use the glossary Spanish when the word has the meaning shown in Context, and translate it normally when it means something else. Never use anything in Do not use.',
  'Spanish (normal word): use it when the word is part of a normal sentence. Example: Tiene 3 prospectos nuevos.',
  'In the app: use it exactly as written when the sentence tells someone to tap, click, open or go to that item. Example: Seleccione Leads (\u201CProspectos\u201D).',
  'Variations and when to use them: when one English word has more than one correct Spanish, this says which one to use in each case.',
  'Do not use: versions that are wrong or not official. Never use them, even if they appear in older articles.',
  'Words that are not in this glossary can be translated however reads best in context.',
  'Use "usted", never "t\u00FA". Write natural Spanish, not word for word. Don\'t add or remove information.',
  'Use sentence case in titles and labels (C\u00F3mo solicitar rese\u00F1as). Official program and policy names keep their capitals (Compromiso de Calidad, Comunidad de Thumbtack).',
  'Steps: Tap X (touch screen) = "Seleccione X". Click X (computer) = "Haga clic en X". "Seleccione X" works for both, so "tap or click X" = "Seleccione X".',
  'No em dashes. No slang or regional expressions.'
];
var GLOSSARY_HEADER = ['Type', 'English', 'Spanish (normal word)', 'In the app (button, tab or menu)',
  'Variations and when to use them', 'Do not use', 'Context (English)', 'Context (Spanish)'];

function glossaryPublish_(force) {
  var terms = glossaryDocReadTerms_();
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
    GLOSSARY_DOC_VERSION + JSON.stringify(terms), Utilities.Charset.UTF_8);
  var hash = Utilities.base64Encode(digest);
  var props = PropertiesService.getScriptProperties();
  var doc = glossaryDocGet_();
  var sheet = glossarySheetGet_();
  var res = { changed: false, terms: terms.length, docUrl: doc.getUrl(), sheetUrl: sheet.getUrl(), autoTranslated: terms.autoTranslated, staleApp: terms.staleApp };
  if (!force && props.getProperty(GLOSSARY_DOC_PROP_HASH) === hash) return res;
  glossaryWriteDoc_(doc, terms);
  glossaryWriteSheet_(sheet, terms);
  props.setProperty(GLOSSARY_DOC_PROP_HASH, hash);
  res.changed = true;
  return res;
}

function glossaryOpenIfAlive_(id) {
  if (!id) return false;
  try { return !DriveApp.getFileById(id).isTrashed(); } catch (e) { return false; }
}

function glossaryDocGet_() {
  var props = PropertiesService.getScriptProperties();
  var ids = [GLOSSARY_DOC_FIXED_ID, props.getProperty(GLOSSARY_DOC_PROP_ID)];
  for (var i = 0; i < ids.length; i++) {
    if (glossaryOpenIfAlive_(ids[i])) {
      if (props.getProperty(GLOSSARY_DOC_PROP_ID) !== ids[i]) {
        props.setProperty(GLOSSARY_DOC_PROP_ID, ids[i]);
        props.deleteProperty(GLOSSARY_DOC_PROP_HASH);
      }
      return DocumentApp.openById(ids[i]);
    }
  }
  var doc = DocumentApp.create(GLOSSARY_DOC_TITLE);
  props.setProperty(GLOSSARY_DOC_PROP_ID, doc.getId());
  props.deleteProperty(GLOSSARY_DOC_PROP_HASH);
  return doc;
}

function glossarySheetGet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(GLOSSARY_SHEET_PROP_ID);
  if (glossaryOpenIfAlive_(id)) return SpreadsheetApp.openById(id);
  var ss = SpreadsheetApp.create(GLOSSARY_DOC_TITLE);
  props.setProperty(GLOSSARY_SHEET_PROP_ID, ss.getId());
  props.deleteProperty(GLOSSARY_DOC_PROP_HASH);
  return ss;
}

function glossaryCounts_(terms) {
  var c = { product: 0, ui: 0, term: 0, category: 0 };
  for (var i = 0; i < terms.length; i++) c[terms[i].kind]++;
  return c;
}

function glossaryWriteSheet_(ss, terms) {
  var readMe = ss.getSheetByName('Read me') || ss.insertSheet('Read me', 0);
  var main = ss.getSheetByName('Glossary') || ss.insertSheet('Glossary', 1);
  var others = ss.getSheets();
  for (var s = 0; s < others.length; s++) {
    var nm = others[s].getName();
    if (nm !== 'Read me' && nm !== 'Glossary') ss.deleteSheet(others[s]);
  }
  var c = glossaryCounts_(terms);
  var tz = Session.getScriptTimeZone();
  var intro = [[GLOSSARY_DOC_TITLE],
    ['This is Thumbtack\'s approved English to Spanish (US) glossary. It updates automatically. Please don\'t edit it: changes are overwritten on the next update. For questions or new terms, contact ' + GLOSSARY_DOC_CONTACT + '.'],
    ['Last updated: ' + Utilities.formatDate(new Date(), tz, 'MMM d, yyyy') + '. Approved terms: ' + terms.length +
      ' (' + c.product + ' product names, ' + c.ui + ' app labels, ' + c.term + ' terms, ' + c.category + ' service categories).'],
    [''], ['How to use the Glossary tab']];
  for (var r = 0; r < GLOSSARY_READ_ME.length; r++) intro.push([GLOSSARY_READ_ME[r]]);
  readMe.clear();
  readMe.getRange(1, 1, intro.length, 1).setValues(intro).setWrap(true).setVerticalAlignment('top');
  readMe.getRange(1, 1).setFontSize(14).setFontWeight('bold');
  readMe.getRange(5, 1).setFontWeight('bold');
  readMe.setColumnWidth(1, 900);

  var rows = [GLOSSARY_HEADER];
  for (var i = 0; i < terms.length; i++) {
    var t = terms[i];
    rows.push([GLOSSARY_KIND_LABEL[t.kind], t.en, t.es, t.app, t.variations, t.doNotUse, t.cxEn, t.cxEs]);
  }
  main.clear();
  if (main.getMaxRows() < rows.length) main.insertRowsAfter(main.getMaxRows(), rows.length - main.getMaxRows());
  main.getRange(1, 1, rows.length, GLOSSARY_HEADER.length).setValues(rows).setWrap(true).setVerticalAlignment('top');
  main.getRange(1, 1, 1, GLOSSARY_HEADER.length).setFontWeight('bold').setBackground('#eeeeee');
  main.setFrozenRows(1);
  var widths = [170, 220, 220, 260, 320, 220, 340, 340];
  for (var w = 0; w < widths.length; w++) main.setColumnWidth(w + 1, widths[w]);
  if (main.getFilter()) main.getFilter().remove();
  main.getRange(1, 1, rows.length, GLOSSARY_HEADER.length).createFilter();
}

function glossaryWriteDoc_(doc, terms) {
  var P = DocumentApp.ParagraphHeading;
  var body = doc.getBody();
  body.clear();
  body.setPageWidth(792).setPageHeight(612);
  body.setMarginLeft(36).setMarginRight(36).setMarginTop(36).setMarginBottom(36);

  var first = body.getParagraphs()[0];
  first.setText(GLOSSARY_DOC_TITLE);
  first.setHeading(P.TITLE);
  var c = glossaryCounts_(terms);
  body.appendParagraph('This is Thumbtack\'s approved English to Spanish (US) glossary. It updates automatically from the glossary the Field Enablement team maintains. Please don\'t edit this Doc: any change is overwritten on the next update. For questions or new terms, contact ' + GLOSSARY_DOC_CONTACT + '.');
  body.appendParagraph('Last updated: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMM d, yyyy') +
    '. Approved terms: ' + terms.length + ' (' + c.product + ' product names, ' + c.ui + ' app labels, ' +
    c.term + ' terms, ' + c.category + ' service categories).').editAsText().setItalic(true);

  body.appendParagraph('How to use this glossary').setHeading(P.HEADING1);
  for (var r = 0; r < GLOSSARY_READ_ME.length; r++) {
    body.appendListItem(GLOSSARY_READ_ME[r]).setGlyphType(DocumentApp.GlyphType.BULLET);
  }

  var sections = [
    ['product', 'Product names (keep in English)', 'Always keep these exactly as written in English.'],
    ['ui', 'App labels (buttons, tabs and menus)', 'When the text tells someone to tap, click or go to it, write it as shown in "In the app".'],
    ['term', 'Terms', 'Use the Spanish when the word has the meaning in the context. If it is also a tab or button, "In the app" shows how to write it.'],
    ['category', 'Service categories', 'Names of types of service.']
  ];
  var head = ['English', 'Spanish', 'In the app', 'Variations / Do not use', 'Context (English)', 'Context (Spanish)'];
  for (var s = 0; s < sections.length; s++) {
    var kind = sections[s][0];
    var rows = [];
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      if (t.kind !== kind) continue;
      var notes = [];
      if (t.variations) notes.push(t.variations);
      if (t.doNotUse) notes.push('Do not use: ' + t.doNotUse);
      rows.push([t.en, t.es, t.app, notes.join(' '), t.cxEn, t.cxEs]);
    }
    body.appendParagraph(sections[s][1]).setHeading(P.HEADING1);
    body.appendParagraph(sections[s][2]);
    if (!rows.length) { body.appendParagraph('No terms yet.'); continue; }
    var table = body.appendTable([head].concat(rows));
    var tStyle = {};
    tStyle[DocumentApp.Attribute.FONT_SIZE] = 9;
    table.setAttributes(tStyle);
    var hr = table.getRow(0);
    for (var h = 0; h < hr.getNumCells(); h++) {
      hr.getCell(h).setBackgroundColor('#eeeeee');
      hr.getCell(h).editAsText().setBold(true);
    }
  }
  doc.saveAndClose();
}


/* ---------------- New UI label candidates ---------------- */

// Finds buttons/tabs that are not in the glossary yet, from:
//  1) Spanish articles that already write them as English ("Spanish")
//  2) bold text in English Help Center articles (Rachel's standard bolds
//     what people tap), which may not have a Spanish version yet.
// Writes them to the glossary_ui_candidates tab for Jorge to approve.
// Nothing here changes the glossary.
function refreshUiCandidates() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var known = {};
  var g = ss.getSheetByName(GLOSSARY_TAB_NAME);
  if (g && g.getLastRow() > 1) {
    var gv = g.getRange(2, 1, g.getLastRow() - 1, GLOSSARY_COLUMNS.length).getValues();
    var iEn = GLOSSARY_COLUMNS.indexOf('en');
    for (var a = 0; a < gv.length; a++) known[normalize_(String(gv[a][iEn] || '').trim())] = true;
  }
  var found = {};
  function add(en, es, source, title) {
    en = String(en || '').replace(/\s+/g, ' ').trim().replace(/[.:,;]+$/, '');
    if (!en || en.length > 60 || en.split(' ').length > 7 || !/^[A-Z0-9+]/.test(en)) return;
    if (glossaryLooksSpanish_(en)) return;
    var k = normalize_(en);
    if (known[k]) return;
    var f = found[k] || (found[k] = { en: en, es: {}, sources: {}, titles: {}, n: 0 });
    f.n++;
    if (es) f.es[es] = (f.es[es] || 0) + 1;
    f.sources[source] = true;
    if (title) f.titles[title] = true;
  }

  // 1) Spanish articles in the corpus
  var corpus = ss.getSheetByName('corpus');
  var langBySlug = {};
  if (corpus && corpus.getLastRow() > 1) {
    var hdr = corpus.getRange(1, 1, 1, corpus.getLastColumn()).getValues()[0];
    var iT = hdr.indexOf('title'), iL = hdr.indexOf('language'), iF = hdr.indexOf('fullText'), iU = hdr.indexOf('url');
    var cv = corpus.getRange(2, 1, corpus.getLastRow() - 1, corpus.getLastColumn()).getValues();
    var lead = /^(?:.*\b)?(?:Seleccione|Haga clic en|Toque|Vaya a(?: su| la| el)?|En|Abra|Elija|Pulse|Presione|Ingrese a)\s+/i;
    var skip = /^(Junto|Las|Los|Lo|La|Con|Sus|Su|Puede|Deje|Busque|A la derecha)\b/;
    for (var r = 0; r < cv.length; r++) {
      var lang = String(cv[r][iL] || '').toLowerCase();
      var m0 = String(cv[r][iU] || '').match(/\/article\/([^\/?#]+)/);
      if (m0) langBySlug[m0[1]] = lang;
      if (lang.indexOf('es') !== 0 && lang.indexOf('spanish') === -1) continue;
      var text = String(cv[r][iF] || '');
      var re = /([A-Z+][A-Za-z0-9&'\u2019\/+\-. ]{0,50}?)\s*\(\s*["\u201C]([^"\u201D]{1,70})["\u201D]\s*\)/g;
      var m;
      while ((m = re.exec(text)) !== null) {
        var en = m[1].trim().replace(lead, '').trim();
        if (skip.test(en)) continue;
        add(en, m[2].trim(), 'Spanish article', String(cv[r][iT] || ''));
      }
    }
  }

  // 2) Bold text in English Help Center articles (Contentful)
  var skipN = 0, total = 1, page = 0;
  while (skipN < total && page < 20) {
    var url = GLOSSARY_CF_BASE + '/entries?content_type=helpCenterArticle&select=fields.slug,fields.title,fields.name,fields.bodyText&include=2&limit=100&skip=' + skipN;
    var resp = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + GLOSSARY_CF_TOKEN }, muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) { Logger.log('Contentful error ' + resp.getResponseCode() + ': ' + resp.getContentText().slice(0, 200)); break; }
    var data = JSON.parse(resp.getContentText());
    total = data.total || 0;
    var inc = {};
    ((data.includes && data.includes.Entry) || []).forEach(function (e) { inc[e.sys.id] = e; });
    (data.items || []).forEach(function (item) {
      var slug = item.fields && item.fields.slug;
      var lang = langBySlug[slug] || '';
      if (lang && lang.indexOf('en') !== 0 && lang.indexOf('english') === -1) return;
      var title = (item.fields && item.fields.title) || slug;
      var name = (item.fields && item.fields.name) || '';
      // v2.1.0: Spanish articles that are not in the corpus yet
      if (/\[spanish\]/i.test(name) || glossaryLooksSpanish_(title)) return;
      glossaryBoldRuns_(item.fields && item.fields.bodyText, inc, 0).forEach(function (b) {
        // v2.1.0: only bold text right after Tap / Click / Select (and similar)
        if (!GLOSSARY_UI_LEAD.test(b.before)) return;
        add(b.text, '', 'English article (bold)', title);
      });
    });
    skipN += 100;
    page++;
  }

  // Write the tab, keeping Jorge's notes from earlier runs
  var sh = ss.getSheetByName(GLOSSARY_CAND_TAB) || ss.insertSheet(GLOSSARY_CAND_TAB);
  var oldNotes = {}, oldKeys = {};
  if (sh.getLastRow() > 1) {
    var ov = sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues();
    for (var o = 0; o < ov.length; o++) {
      var ok = normalize_(String(ov[o][0] || ''));
      oldKeys[ok] = true;
      oldNotes[ok] = ov[o][6];
    }
  }
  var list = Object.keys(found).map(function (k) { return found[k]; });
  list.sort(function (x, y) { return y.n - x.n; });
  var rows = [['English', 'Spanish already published', 'Times found', 'Where', 'Articles', 'New this week', 'Your decision (approve / no / Spanish to use)']];
  var fresh = [];
  list.forEach(function (f) {
    var esList = Object.keys(f.es).sort(function (p, q) { return f.es[q] - f.es[p]; });
    var k = normalize_(f.en);
    var isNew = !oldKeys[k];
    if (isNew) fresh.push(f.en);
    rows.push([f.en, esList.join(' / '), f.n, Object.keys(f.sources).join(', '),
      Object.keys(f.titles).slice(0, 3).join(' | '), isNew ? 'yes' : '', oldNotes[k] || '']);
  });
  sh.clearContents();
  sh.getRange(1, 1, rows.length, 7).setValues(rows);
  sh.setFrozenRows(1);
  Logger.log('UI candidates: ' + (rows.length - 1) + ' (new this run: ' + fresh.length + '). See tab ' + GLOSSARY_CAND_TAB + '.');
  if (fresh.length) {
    MailApp.sendEmail('jcardona@thumbtack.com', 'Glossary: ' + fresh.length + ' new UI labels to review',
      'These buttons or tabs are not in the glossary yet:\n\n' + fresh.slice(0, 100).join('\n') +
      (fresh.length > 100 ? '\n...and ' + (fresh.length - 100) + ' more.' : '') +
      '\n\nReview them in the ' + GLOSSARY_CAND_TAB + ' tab of the corpus sheet:\nhttps://docs.google.com/spreadsheets/d/' + CORPUS_SHEET_ID_LITERAL + '/edit');
  }
}

// Words that come right before a button, tab or menu in a step.
var GLOSSARY_UI_LEAD = /\b(tap|click|select|choose|press|open|go to|toggle|turn on|turn off|check|uncheck|hit|enter)(\s+(on|the|your|a|an|into))*\s*["\u201C]?\s*$/i;

// True when a piece of text reads as Spanish (accents, ¿ ¡, common Spanish words).
function glossaryLooksSpanish_(t) {
  t = String(t || '');
  if (/[\u00E1\u00E9\u00ED\u00F3\u00FA\u00F1\u00BF\u00A1]/i.test(t)) return true;
  if (/[a-z]ciones\b|[a-z]ci\u00F3n\b/i.test(t)) return true;
  return /(^|\s)(o|y|de|del|la|las|el|los|en|su|sus|para|con|una|uno|por|que|nota|pagos|preguntas|frecuentes|precios)(\s|$)/i.test(t);
}

// Collects bold text runs (adjacent bold pieces joined) from a rich text node,
// also inside embedded entries such as tips. Each run comes with the plain
// text right before it ("before"), so callers can keep only real UI labels.
// Embedded entries whose name ends in [Spanish] are skipped.
function glossaryBoldRuns_(node, inc, depth) {
  var out = [];
  if (!node || depth > 6) return out;
  var buf = '', before = '', plain = '';
  function flush() { if (buf.trim()) out.push({ text: buf.trim(), before: before }); buf = ''; }
  (node.content || []).forEach(function (ch) {
    if (ch.nodeType === 'text') {
      var bold = (ch.marks || []).some(function (mk) { return mk.type === 'bold'; });
      if (bold) {
        if (!buf) before = plain.slice(-40);
        buf += ch.value;
      } else {
        flush();
        plain += ch.value;
      }
    } else {
      flush();
      if (ch.nodeType === 'embedded-entry-block' || ch.nodeType === 'embedded-entry-inline') {
        var id = ch.data && ch.data.target && ch.data.target.sys && ch.data.target.sys.id;
        var e = id && inc[id];
        if (e && e.fields && !/\[spanish\]/i.test(String(e.fields.name || e.fields.internalName || ''))) {
          Object.keys(e.fields).forEach(function (fk) {
            var fv = e.fields[fk];
            if (fv && fv.nodeType === 'document') out = out.concat(glossaryBoldRuns_(fv, inc, depth + 1));
          });
        }
      } else {
        out = out.concat(glossaryBoldRuns_(ch, inc, depth + 1));
      }
    }
  });
  flush();
  return out;
}
