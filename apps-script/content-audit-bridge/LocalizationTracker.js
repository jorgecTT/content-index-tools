/**
 * ================================================================
 * Content Audit — Localization Tracker  (LocalizationTracker.gs)
 * v1.4.0
 * ================================================================
 * Lives in the SAME Apps Script project as CorpusSync.gs + WebApp.gs.
 * Reuses COLUMNS, getSheet_, CORPUS_SHEET_ID_LITERAL,
 * fetchContentfulNameBySlug_ and translationKeyFromName_ from
 * CorpusSync.gs — do not redeclare them here.
 *
 * v1.4.0 changes (AI translation score):
 *   - NEW COLUMN 'aiScore' appended at the END of the tracker tab (no
 *     existing column moves). Holds the 0-100 AI triage score written
 *     by the app via WebApp v1.9.3 (set_status action:"score").
 *   - aiScore is MANUAL-class data: preserved on every rebuild, matched
 *     by translationKey+audience like the other preserved fields.
 *
 * v1.3.0 changes (audience-aware grouping):
 *   - Articles grouped by translationKey + audience: pro and customer
 *     variants of the same article get one row each. False "duplicate
 *     EN" notes eliminated; real duplicates still flagged.
 *   - Manual-field preservation matches by key+audience first, with a
 *     safe fallback to key alone when that key has exactly ONE row.
 *
 * v1.2.0: columns 'startedDate' (manual, preserved) and 'esLastUpdated'
 *         (automatic, recomputed nightly).
 * v1.1.x: audited seed migration (applyAuditedSeedOnce).
 *
 * STATUS VALUES:
 *   not_translated | translated | in_audit | audited | es_only | no_key
 *
 * SAFETY GUARANTEES (unchanged):
 *   - READS the 'corpus' tab only (light columns, NEVER fullText).
 *   - WRITES ONLY to the 'localization_tracker' tab.
 *   - Builds all rows in memory, ONE setValues() at the end.
 *   - Manual statuses (audited / in_audit) + auditedDate + accuracy +
 *     notes + startedDate + aiScore are preserved on every rebuild.
 *
 * SETUP FOR v1.4.0 (after pasting this file):
 *   1) Run buildLocalizationTracker() once — the tab is rewritten with
 *      the aiScore header column added at the end. All existing manual
 *      data is preserved. Verify the audited rows kept their values.
 *   2) The nightly 6 AM trigger keeps working as-is.
 * ================================================================ */

var TRACKER_TAB_NAME = 'localization_tracker';

var TRACKER_COLUMNS = [
  'translationKey', 'titleEN', 'docIdEN', 'docIdES', 'docIdPT',
  'audience', 'status', 'auditedDate', 'accuracy', 'notes',
  'startedDate', 'esLastUpdated', 'aiScore'
];

// Statuses that a rebuild must NEVER overwrite (manual states).
var TRACKER_MANUAL_STATUSES = { 'audited': 1, 'in_audit': 1 };


/* ================================================================
 * MAIN — build (or rebuild) the tracker tab. Safe to run any time.
 * ================================================================ */
function buildLocalizationTracker() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var corpus = getSheet_();

  // ---- 1) READ the light columns from the corpus tab (never fullText) ----
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
  var lastUpds   = corpus.getRange(2, col('lastUpdated'),    n, 1).getValues();

  // ---- 2) GROUP HC + active docs by translationKey + AUDIENCE ----
  var groups = {};        // "key||audience" -> { key, audience, en, es, pt, titleEN, titleAny, esUpdated, dupes }
  var noKeyRows = [];     // HC docs still missing a translationKey (visible!)

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
    var lastUpd = Number(lastUpds[r][0] || 0);

    if (!key) {
      noKeyRows.push({
        translationKey: '', titleEN: title,
        docIdEN: (lang === 'EN' ? docId : ''),
        docIdES: (lang === 'ES' ? docId : ''),
        docIdPT: (lang === 'PT' ? docId : ''),
        audience: audience, status: 'no_key',
        auditedDate: '', accuracy: '',
        notes: 'Missing translationKey — run backfillTranslationKeyOnce()',
        startedDate: '', esLastUpdated: '', aiScore: ''
      });
      continue;
    }

    var bucket = key + '||' + audience;
    if (!groups[bucket]) {
      groups[bucket] = { key: key, audience: audience, en: '', es: '', pt: '',
                         titleEN: '', titleAny: '', esUpdated: '', dupes: [] };
    }
    var g = groups[bucket];
    if (!g.titleAny) g.titleAny = title;

    if (lang === 'EN') {
      if (g.en) { g.dupes.push('duplicate EN: ' + docId); }
      else { g.en = docId; g.titleEN = title; }
    } else if (lang === 'ES') {
      if (g.es) { g.dupes.push('duplicate ES: ' + docId); }
      else { g.es = docId; g.esUpdated = lastUpd || ''; }
    } else if (lang === 'PT') {
      if (g.pt) { g.dupes.push('duplicate PT: ' + docId); }
      else { g.pt = docId; }
    }
  }

  // ---- 3) READ the existing tracker tab to PRESERVE manual fields ----
  // Primary match: key+audience. Fallback: key alone, ONLY when that key
  // has exactly one row in the old tab.
  var existingByKeyAud = {};   // "key||audience" -> fields
  var existingByKey = {};      // key -> { count, fields }
  var tracker = ss.getSheetByName(TRACKER_TAB_NAME);
  if (tracker && tracker.getLastRow() > 1) {
    var eN = tracker.getLastRow() - 1;
    var eCols = Math.max(1, tracker.getLastColumn());
    var eHdr = tracker.getRange(1, 1, 1, eCols).getValues()[0].map(String);
    var eVals = tracker.getRange(2, 1, eN, eCols).getValues();
    var hIdx = function (name) { return eHdr.indexOf(name); };
    var iKey = hIdx('translationKey');
    var iAud = hIdx('audience');
    var iSt  = hIdx('status');
    var iDt  = hIdx('auditedDate');
    var iAc  = hIdx('accuracy');
    var iNo  = hIdx('notes');
    var iSd  = hIdx('startedDate');
    var iSc  = hIdx('aiScore');   // -1 if the column doesn't exist yet (pre-v1.4.0)
    if (iKey !== -1) {
      for (var e = 0; e < eN; e++) {
        var ek = String(eVals[e][iKey] || '').trim();
        if (!ek) continue;
        var ea = (iAud !== -1) ? String(eVals[e][iAud] || '').toLowerCase().trim() : '';
        var fields = {
          status:      (iSt !== -1) ? String(eVals[e][iSt] || '') : '',
          auditedDate: (iDt !== -1) ? eVals[e][iDt] : '',
          accuracy:    (iAc !== -1) ? eVals[e][iAc] : '',
          notes:       (iNo !== -1) ? String(eVals[e][iNo] || '') : '',
          startedDate: (iSd !== -1) ? eVals[e][iSd] : '',
          aiScore:     (iSc !== -1) ? eVals[e][iSc] : ''
        };
        existingByKeyAud[ek + '||' + ea] = fields;
        if (!existingByKey[ek]) existingByKey[ek] = { count: 0, fields: null };
        existingByKey[ek].count++;
        existingByKey[ek].fields = fields;
      }
    }
  }

  function findPrev(key, audience) {
    var exact = existingByKeyAud[key + '||' + audience];
    if (exact) return exact;
    var byKey = existingByKey[key];
    if (byKey && byKey.count === 1) return byKey.fields;   // unique key -> safe
    return null;
  }

  // ---- 4) BUILD all rows in memory ----
  var rows = [];
  var counts = { not_translated: 0, translated: 0, audited: 0, in_audit: 0, es_only: 0, no_key: noKeyRows.length };
  var preservedManual = 0;

  Object.keys(groups).sort().forEach(function (bucket) {
    var g = groups[bucket];
    var prev = findPrev(g.key, g.audience);

    // Automatic status from sibling presence:
    var autoStatus;
    if (!g.en && (g.es || g.pt)) autoStatus = 'es_only';
    else if (g.es)               autoStatus = 'translated';
    else                         autoStatus = 'not_translated';

    // Preserve manual states + their metadata:
    var status = autoStatus;
    var auditedDate = '', accuracy = '', notes = '', startedDate = '', aiScore = '';
    if (prev) {
      if (TRACKER_MANUAL_STATUSES[prev.status]) { status = prev.status; preservedManual++; }
      auditedDate = prev.auditedDate || '';
      accuracy = prev.accuracy || '';
      notes = prev.notes || '';
      startedDate = prev.startedDate || '';
      aiScore = (prev.aiScore === 0 || prev.aiScore) ? prev.aiScore : '';
    }
    // Strip old false-positive dupe notes; only REAL dupes found in THIS
    // build are re-added below.
    if (notes) {
      notes = notes.split(' | ')
        .filter(function (s) { return !/^duplicate (EN|ES|PT):/i.test(s.trim()); })
        .join(' | ');
    }
    if (g.dupes.length) {
      var dupeNote = g.dupes.join('; ');
      if (String(notes).indexOf(dupeNote) === -1) {
        notes = notes ? (notes + ' | ' + dupeNote) : dupeNote;
      }
    }

    counts[status] = (counts[status] || 0) + 1;

    rows.push([
      g.key, g.titleEN || g.titleAny, g.en, g.es, g.pt,
      g.audience, status, auditedDate, accuracy, notes,
      startedDate, g.esUpdated, aiScore
    ]);
  });

  // no_key rows go at the bottom, visible.
  noKeyRows.forEach(function (nk) {
    rows.push([
      nk.translationKey, nk.titleEN, nk.docIdEN, nk.docIdES, nk.docIdPT,
      nk.audience, nk.status, nk.auditedDate, nk.accuracy, nk.notes,
      nk.startedDate, nk.esLastUpdated, nk.aiScore
    ]);
  });

  // ---- 5) ONE write to the tracker tab ----
  if (!tracker) {
    tracker = ss.insertSheet(TRACKER_TAB_NAME);
  }
  tracker.clearContents();
  tracker.getRange(1, 1, 1, TRACKER_COLUMNS.length).setValues([TRACKER_COLUMNS]);
  tracker.setFrozenRows(1);
  if (rows.length) {
    tracker.getRange(2, 1, rows.length, TRACKER_COLUMNS.length).setValues(rows);
  }

  Logger.log('Localization Tracker rebuilt — ' + rows.length + ' rows (v1.4.0, aiScore column).');
  Logger.log('  ' + JSON.stringify(counts));
  Logger.log('  Manual statuses preserved: ' + preservedManual);
}


/* ================================================================
 * ONE-TIME — install the nightly rebuild trigger (~6 AM).
 * ================================================================ */
function installTrackerNightlyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'buildLocalizationTracker') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('buildLocalizationTracker')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();
  Logger.log('Tracker nightly trigger installed (~6 AM daily).');
}


/* ================================================================
 * DIAGNOSTIC — quick summary without rebuilding anything.
 * ================================================================ */
function trackerStatus() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var tracker = ss.getSheetByName(TRACKER_TAB_NAME);
  if (!tracker || tracker.getLastRow() < 2) { Logger.log('Tracker vacío o no existe. Corre buildLocalizationTracker().'); return; }
  var n = tracker.getLastRow() - 1;
  var iSt = TRACKER_COLUMNS.indexOf('status') + 1;
  var iAud = TRACKER_COLUMNS.indexOf('audience') + 1;
  var iSc = TRACKER_COLUMNS.indexOf('aiScore') + 1;
  var sts = tracker.getRange(2, iSt, n, 1).getValues();
  var auds = tracker.getRange(2, iAud, n, 1).getValues();
  var scs = tracker.getRange(2, iSc, n, 1).getValues();
  var byStatus = {}, byAudStatus = {};
  var scored = 0;
  for (var r = 0; r < n; r++) {
    var s = String(sts[r][0] || '');
    var a = String(auds[r][0] || '(blank)');
    byStatus[s] = (byStatus[s] || 0) + 1;
    var k = a + ' / ' + s;
    byAudStatus[k] = (byAudStatus[k] || 0) + 1;
    if (String(scs[r][0]) !== '') scored++;
  }
  Logger.log('Tracker rows: ' + n);
  Logger.log('By status: ' + JSON.stringify(byStatus));
  Logger.log('Rows with aiScore: ' + scored);
  Logger.log('By audience+status: ' + JSON.stringify(byAudStatus, null, 2));
}


/* ================================================================
 * AUDITED SEED MIGRATION — one-time (kept for reference; already run).
 * If a translationKey maps to MORE THAN ONE tracker row (pro + customer
 * variants), that entry is logged as ambiguous instead of guessing.
 * Safe to re-run.
 * ================================================================ */
function applyAuditedSeedOnce() {
  var AUDITED_SEED = [
    { slug: 'como-registrarse-como-profesional',                                title: 'Cómo registrarse como profesional',                    date: '3/9/2026',  accuracy: '98%', notes: '' },
    { slug: 'como-iniciar-sesion',                                              title: 'Cómo iniciar sesión en mi cuenta',                     date: '3/10/2026', accuracy: '90%', notes: 'Adding English translation on the text, instead of Spanish. Changing titles on app steps from Computadora to desktop' },
    { slug: 'how-to-request-a-payment-from-a-customer',                         title: 'Cómo solicitar un pago a un cliente',                  date: '3/11/2026', accuracy: '95%', notes: 'New Article' },
    { slug: 'como-funciona-thumbtack',                                          title: 'Cómo funciona Thumbtack',                              date: '3/12/2026', accuracy: '95%', notes: '' },
    { slug: '',                                                                 title: 'Guía para sus primeras dos semanas en Thumbtack',      date: '4/6/2026',  accuracy: '97%', notes: '' },
    { slug: '',                                                                 title: '¿Por qué elegir Thumbtack?',                           date: '4/6/2026',  accuracy: '97%', notes: '' },
    { slug: 'he-aqui-una-guia-para-invertir-su-dinero-en-thumbtack',            title: 'Guía para invertir su dinero en Thumbtack',            date: '4/7/2026',  accuracy: '98%', notes: '' },
    { slug: 'como-descargar-nuestra-aplicacion-para-profesionales',             title: 'Cómo descargar nuestra aplicación para profesionales', date: '4/7/2026',  accuracy: '98%', notes: '' },
    { slug: 'como-cambiar-entre-su-cuenta-de-profesional-y-su-cuenta-de-cliente', title: 'Cómo cambiar entre su cuenta de profesional y su cuenta de cliente', date: '4/8/2026', accuracy: '98%', notes: '' },
    { slug: 'que-es-front-desk',                                                title: '¿Qué es Front Desk?',                                  date: '4/9/2026',  accuracy: '98%', notes: '' },
    { slug: 'Como-crear-un-webhook',                                            title: 'Cómo crear un webhook',                                date: '4/13/2026', accuracy: '95%', notes: 'New Article' },
    { slug: 'como-configurar-un-webhook-en-zapier',                             title: 'Cómo configurar un webhook en Zapier',                 date: '4/13/2026', accuracy: '95%', notes: 'New Article' },
    { slug: 'politica-reebolsos-profesionales',                                 title: 'Política de reembolsos para profesionales',            date: '4/22/2026', accuracy: '90%', notes: 'Improve Prompt — STRICT ANTI-SUMMARIZATION RULE' },
    { slug: '',                                                                 title: 'Cómo solicitar un reembolso',                          date: '4/22/2026', accuracy: '',    notes: '' },
    { slug: 'background-checks',                                                title: 'Cómo realizar una verificación de antecedentes',       date: '5/7/2026',  accuracy: '',    notes: '' }
  ];

  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var tracker = ss.getSheetByName(TRACKER_TAB_NAME);
  if (!tracker || tracker.getLastRow() < 2) {
    throw new Error('Tracker vacío o no existe. Corre buildLocalizationTracker() primero.');
  }

  var n = tracker.getLastRow() - 1;
  var keyCol = TRACKER_COLUMNS.indexOf('translationKey') + 1;
  var stCol  = TRACKER_COLUMNS.indexOf('status') + 1;
  var keys = tracker.getRange(2, keyCol, n, 1).getValues();
  var rowsOf = {};   // key -> [rowIndex, ...]
  for (var r = 0; r < n; r++) {
    var k = String(keys[r][0] || '').trim();
    if (!k) continue;
    if (!rowsOf[k]) rowsOf[k] = [];
    rowsOf[k].push(r + 2);
  }

  var updated = 0;
  var unmatched = [];

  for (var i = 0; i < AUDITED_SEED.length; i++) {
    var entry = AUDITED_SEED[i];

    if (!entry.slug) {
      unmatched.push({ title: entry.title, reason: 'no slug in audit sheet — mark manually' });
      continue;
    }

    var name = fetchContentfulNameBySlug_(entry.slug);
    if (!name) {
      unmatched.push({ title: entry.title, reason: 'Contentful returned no name for slug "' + entry.slug + '"' });
      Utilities.sleep(150);
      continue;
    }
    var tkey = translationKeyFromName_(name);

    var rowsForKey = rowsOf[tkey] || [];
    if (rowsForKey.length === 0) {
      unmatched.push({ title: entry.title, reason: 'translationKey "' + tkey + '" not found in tracker' });
      Utilities.sleep(150);
      continue;
    }
    if (rowsForKey.length > 1) {
      unmatched.push({ title: entry.title, reason: 'translationKey "' + tkey + '" is AMBIGUOUS (' + rowsForKey.length + ' rows) — mark manually' });
      Utilities.sleep(150);
      continue;
    }

    tracker.getRange(rowsForKey[0], stCol, 1, 4).setValues([[
      'audited', entry.date, entry.accuracy, entry.notes
    ]]);
    updated++;

    Utilities.sleep(150);
  }

  Logger.log('Audited seed applied. Marked as audited: ' + updated + ' / ' + AUDITED_SEED.length);
  if (unmatched.length) {
    Logger.log('NOT matched (' + unmatched.length + ') — mark these by hand in the tracker tab:');
    unmatched.forEach(function (u) {
      Logger.log('  - "' + u.title + '" -> ' + u.reason);
    });
  }
}

