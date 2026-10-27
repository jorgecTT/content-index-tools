/**
 * ================================================================
 * Content Audit — Web App  (Piece 2 of 2: serves the Sheet as JSON)
 * v1.9.8
 * ================================================================
 * Lives in the SAME Apps Script project as CorpusSync.gs.
 * Reuses COLUMNS, getSheet_, and getProp_ from that file — do not
 * redeclare them here. Also reuses TRACKER_TAB_NAME and
 * TRACKER_COLUMNS from LocalizationTracker.gs (v1.4.0), and
 * slugAliasAdd_ from SlugAliases.gs (v1.0.0 — REQUIRED).
 *
 * v1.9.8 changes (slug aliases):
 *   - mode=slug_alias_add { oldSlug, source? } — accepts a bare slug
 *     OR a full help.thumbtack.com URL. Resolves the current slug by
 *     following the Help Center 301 server-side, records the pair in
 *     the slug_aliases tab, and returns the currentSlug in the same
 *     response. Dedupe: known oldSlug returns the stored currentSlug
 *     without re-fetching. Available as POST (JSON body) AND as GET
 *     (?mode=slug_alias_add&oldSlug=...) so GET-only bridges work.
 *     Errors are explicit (404, no redirect, redirect outside
 *     /article/) — never guessed.
 *
 * v1.9.7: POST mode=glossary_set_type { en, es, type } (reclassify
 *   one row, matched by en + es; writes ONLY the type column).
 * v1.9.6: GLOSSARY_COLUMNS + 'type' (7th col); mode=glossary serves
 *   type and accepts &type= filter; glossary_add accepts optional
 *   per-item "type" (validated; invalid stored empty).
 * v1.9.5: POST mode=glossary_resolve (one-click conflict resolution).
 * v1.9.4: mode=search accepts &language=EN|ES|PT (server-side filter).
 * v1.9.3: set_status action:"score" (aiScore 0-100, Tracker v1.4.0).
 * v1.9.2: set_status action:"cancel". v1.9.1: glossary tab + context.
 * v1.8.x: set_status. v1.7.0: tracker. v1.6.x-1.4.0: search/enrich.
 *
 * Endpoints (GET):
 *   ?mode=ping | ?mode=list | ?mode=full&ids=...
 *   ?mode=search&q=... [&language=EN|ES|PT]
 *   ?mode=tracker  [&audience=][&status=]
 *   ?mode=glossary [&status=...][&type=product|ui|term]
 *   ?mode=slug_alias_add&oldSlug=... [&source=...]
 *
 * Endpoints (POST, JSON body):
 *   { mode:"enrich", key?, items:[...] }
 *   { mode:"set_status", key?, translationKey, audience?,
 *     action:"start"|"complete"|"cancel"|"score", ... }
 *   { mode:"glossary_add", key?, sourceArticle?, items:[{en, es, context?, type?}] }
 *   { mode:"glossary_resolve", key?, en, winnerEs }
 *   { mode:"glossary_set_type", key?, en, es, type }
 *   { mode:"slug_alias_add", key?, oldSlug, source? }
 *
 * Optional security: Script Property WEBAPP_SECRET gates every request.
 * Deploy: Manage deployments > pencil > New version (URL never changes).
 * ================================================================ */

var WEBAPP_SECRET_PROP = 'WEBAPP_SECRET';

// How much context to show around a body match.
var SNIPPET_RADIUS = 90;

// Relevance gate: a result must reach at least this score to be returned.
var MIN_SCORE = 2.5;

// Hard cap on how many results the search returns, after ranking.
var MAX_RESULTS = 50;

// Self-feeding glossary tab (type added in v1.9.6).
var GLOSSARY_TAB_NAME = 'glossary_auto';
var GLOSSARY_COLUMNS = ['en', 'es', 'context', 'sourceArticle', 'dateAdded', 'status', 'type'];
var GLOSSARY_VALID_TYPES = { 'product': 1, 'ui': 1, 'term': 1 };

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};

    // Optional shared-secret gate
    var secret = PropertiesService.getScriptProperties().getProperty(WEBAPP_SECRET_PROP);
    if (secret && params.key !== secret) {
      return jsonOut_({ ok: false, error: 'Unauthorized' });
    }

    var mode = params.mode || 'ping';

    if (mode === 'ping') {
      var sheet = getSheet_();
      var rows = Math.max(0, sheet.getLastRow() - 1);
      return jsonOut_({ ok: true, mode: 'ping', sheetRows: rows, time: new Date().toISOString() });
    }

    if (mode === 'list') {
      var light = readLightRows_(getSheet_());
      return jsonOut_({ ok: true, mode: 'list', count: light.length, articles: light });
    }

    if (mode === 'full') {
      if (!params.ids) return jsonOut_({ ok: false, error: 'Missing ids parameter' });
      var ids = String(params.ids).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      if (ids.length === 0) return jsonOut_({ ok: false, error: 'No valid ids' });
      var full = readFullByIds_(getSheet_(), ids);
      return jsonOut_({ ok: true, mode: 'full', count: full.length, articles: full });
    }

    if (mode === 'search') {
      var q = (params.q || '').trim();
      if (!q) return jsonOut_({ ok: false, error: 'Missing q parameter' });
      var langFilter = String(params.language || '').trim().toUpperCase();
      var matches = searchCorpus_(getSheet_(), q, langFilter);
      return jsonOut_({ ok: true, mode: 'search', q: q, language: langFilter || 'all', count: matches.length, articles: matches });
    }

    if (mode === 'tracker') {
      var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
      var trk = ss.getSheetByName(TRACKER_TAB_NAME);
      if (!trk || trk.getLastRow() < 2) {
        return jsonOut_({ ok: false, error: 'Tracker tab is empty or missing. Run buildLocalizationTracker() first.' });
      }
      var tn = trk.getLastRow() - 1;
      var tVals = trk.getRange(2, 1, tn, TRACKER_COLUMNS.length).getValues();
      var items = [];
      var summary = {};
      for (var tr = 0; tr < tn; tr++) {
        var row = tVals[tr];
        var obj = {};
        for (var tc = 0; tc < TRACKER_COLUMNS.length; tc++) {
          obj[TRACKER_COLUMNS[tc]] = row[tc];
        }
        if (params.audience && String(obj.audience).toLowerCase() !== String(params.audience).toLowerCase()) continue;
        if (params.status && String(obj.status).toLowerCase() !== String(params.status).toLowerCase()) continue;
        items.push(obj);
        var sKey = String(obj.status || '(blank)');
        summary[sKey] = (summary[sKey] || 0) + 1;
      }
      return jsonOut_({ ok: true, mode: 'tracker', count: items.length, summary: summary, items: items });
    }

    if (mode === 'glossary') {
      var gss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
      var gsh = gss.getSheetByName(GLOSSARY_TAB_NAME);
      if (!gsh || gsh.getLastRow() < 2) {
        return jsonOut_({ ok: true, mode: 'glossary', count: 0, terms: [] });
      }
      var gn = gsh.getLastRow() - 1;
      var gVals = gsh.getRange(2, 1, gn, GLOSSARY_COLUMNS.length).getValues();
      var terms = [];
      for (var gr = 0; gr < gn; gr++) {
        var gObj = {};
        for (var gc = 0; gc < GLOSSARY_COLUMNS.length; gc++) {
          gObj[GLOSSARY_COLUMNS[gc]] = gVals[gr][gc];
        }
        if (!String(gObj.en || '').trim()) continue;
        if (params.status && String(gObj.status).toLowerCase() !== String(params.status).toLowerCase()) continue;
        if (params.type && String(gObj.type).toLowerCase() !== String(params.type).toLowerCase()) continue;
        terms.push(gObj);
      }
      return jsonOut_({ ok: true, mode: 'glossary', count: terms.length, terms: terms });
    }

    if (mode === 'slug_alias_add') {
      // GET variant for GET-only bridges. Same behavior as the POST.
      var gOld = String(params.oldSlug || '').trim();
      if (!gOld) return jsonOut_({ ok: false, error: 'Missing oldSlug parameter' });
      var gRes2 = slugAliasAdd_(gOld, String(params.source || 'webapp-get'));
      if (!gRes2.ok) return jsonOut_({ ok: false, mode: 'slug_alias_add', oldSlug: gRes2.oldSlug || gOld, error: gRes2.error });
      return jsonOut_({ ok: true, mode: 'slug_alias_add', oldSlug: gRes2.oldSlug,
                        currentSlug: gRes2.currentSlug, cached: !!gRes2.cached,
                        currentUrl: 'https://help.thumbtack.com/article/' + gRes2.currentSlug,
                        note: gRes2.note || '' });
    }
    if (mode === 'corpus_sync') {
      // nightlySync() corre hasta MAX_RUNTIME_MS (4.5 min), muy por encima de lo
      // que aguanta una petición HTTP. Así que no lo llamamos aquí: lo lanzamos
      // en un trigger inmediato y respondemos al instante.
      ScriptApp.getProjectTriggers().forEach(function (t) {
        if (t.getHandlerFunction() === 'runManualCorpusSync') ScriptApp.deleteTrigger(t);
      });
      ScriptApp.newTrigger('runManualCorpusSync').timeBased().after(1000).create();
      return jsonOut_({
        ok: true,
        mode: 'corpus_sync',
        started: true,
        note: 'Sync started in the background (~1-5 min): corpus, then tracker.'
      });
    }
    return jsonOut_({ ok: false, error: 'Unknown mode: ' + mode });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}


/* ================================================================
 * WRITE — POST handler
 * mode=enrich            -> summary/concepts/aliases by docId (corpus tab)
 * mode=set_status        -> audit lifecycle writeback (tracker tab)
 * mode=glossary_add      -> EN->ES term pairs (glossary_auto tab)
 * mode=glossary_resolve  -> one-click conflict resolution (glossary_auto tab)
 * mode=glossary_set_type -> reclassify one row's type (glossary_auto tab)
 * mode=slug_alias_add    -> resolve + record an old HC slug (slug_aliases tab)
 * Honors the SAME optional WEBAPP_SECRET gate as doGet.
 * ================================================================ */
function doPost(e) {
  try {
    // Parse JSON body
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        return jsonOut_({ ok: false, error: 'Invalid JSON body' });
      }
    }

    // Optional shared-secret gate (same property as GET).
    var secret = PropertiesService.getScriptProperties().getProperty(WEBAPP_SECRET_PROP);
    if (secret) {
      var provided = body.key || (e && e.parameter && e.parameter.key);
      if (provided !== secret) {
        return jsonOut_({ ok: false, error: 'Unauthorized' });
      }
    }

    var mode = body.mode || (e && e.parameter && e.parameter.mode) || '';

    if (mode === 'enrich') {
      if (!Array.isArray(body.items)) {
        return jsonOut_({ ok: false, error: 'Missing items array' });
      }
      if (body.items.length === 0) {
        return jsonOut_({ ok: true, mode: 'enrich', updated: 0, notFound: 0 });
      }
      if (body.items.length > 200) {
        return jsonOut_({ ok: false, error: 'Too many items in one POST (max 200)' });
      }
      var res = enrichRows_(getSheet_(), body.items);
      return jsonOut_({ ok: true, mode: 'enrich', updated: res.updated, notFound: res.notFound });
    }

    if (mode === 'set_status') {
      var tkey = String(body.translationKey || '').trim();
      var audience = String(body.audience || '').toLowerCase().trim();
      var action = String(body.action || '').trim().toLowerCase();
      if (!tkey) return jsonOut_({ ok: false, error: 'Missing translationKey' });
      if (action !== 'start' && action !== 'complete' && action !== 'cancel' && action !== 'score') {
        return jsonOut_({ ok: false, error: 'Invalid action: must be "start", "complete", "cancel" or "score"' });
      }

      var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
      var trk = ss.getSheetByName(TRACKER_TAB_NAME);
      if (!trk || trk.getLastRow() < 2) {
        return jsonOut_({ ok: false, error: 'Tracker tab is empty or missing.' });
      }

      // Find candidate rows by translationKey (may be several: pro/customer variants).
      var n = trk.getLastRow() - 1;
      var keyCol = TRACKER_COLUMNS.indexOf('translationKey') + 1;
      var audCol = TRACKER_COLUMNS.indexOf('audience') + 1;
      var keys = trk.getRange(2, keyCol, n, 1).getValues();
      var auds = trk.getRange(2, audCol, n, 1).getValues();

      var candidates = [];
      for (var r = 0; r < n; r++) {
        if (String(keys[r][0] || '').trim() === tkey) {
          candidates.push({ rowIndex: r + 2, audience: String(auds[r][0] || '').toLowerCase().trim() });
        }
      }

      if (candidates.length === 0) {
        return jsonOut_({ ok: false, error: 'translationKey not found in tracker: ' + tkey });
      }

      var rowIndex = -1;
      if (candidates.length === 1) {
        if (audience && candidates[0].audience !== audience) {
          return jsonOut_({ ok: false, error: 'audience mismatch: tracker row for "' + tkey +
                            '" has audience "' + candidates[0].audience + '", got "' + audience + '"' });
        }
        rowIndex = candidates[0].rowIndex;
      } else {
        if (!audience) {
          var opts = candidates.map(function (c) { return c.audience || '(blank)'; }).join(', ');
          return jsonOut_({ ok: false, error: 'translationKey "' + tkey + '" matches ' + candidates.length +
                            ' rows (audiences: ' + opts + '). Include "audience" in the request to pick one.' });
        }
        for (var c = 0; c < candidates.length; c++) {
          if (candidates[c].audience === audience) { rowIndex = candidates[c].rowIndex; break; }
        }
        if (rowIndex === -1) {
          return jsonOut_({ ok: false, error: 'No tracker row for translationKey "' + tkey +
                            '" with audience "' + audience + '"' });
        }
      }

      var stCol = TRACKER_COLUMNS.indexOf('status') + 1;
      var adCol = TRACKER_COLUMNS.indexOf('auditedDate') + 1;
      var acCol = TRACKER_COLUMNS.indexOf('accuracy') + 1;
      var noCol = TRACKER_COLUMNS.indexOf('notes') + 1;
      var sdCol = TRACKER_COLUMNS.indexOf('startedDate') + 1;

      if (action === 'start') {
        trk.getRange(rowIndex, stCol).setValue('in_audit');
        trk.getRange(rowIndex, sdCol).setValue(new Date().toISOString());
        return jsonOut_({ ok: true, mode: 'set_status', action: 'start',
                          translationKey: tkey, audience: audience || candidates[0].audience,
                          status: 'in_audit' });
      }

      if (action === 'cancel') {
        // Return the row to its AUTOMATIC status and clear startedDate.
        // auditedDate / accuracy / notes are left untouched.
        var esCol = TRACKER_COLUMNS.indexOf('docIdES') + 1;
        var hasES = !!String(trk.getRange(rowIndex, esCol).getValue() || '').trim();
        var autoStatus = hasES ? 'translated' : 'not_translated';
        trk.getRange(rowIndex, stCol).setValue(autoStatus);
        trk.getRange(rowIndex, sdCol).setValue('');
        return jsonOut_({ ok: true, mode: 'set_status', action: 'cancel',
                          translationKey: tkey, audience: audience || candidates[0].audience,
                          status: autoStatus });
      }

      if (action === 'score') {
        // Write ONLY the aiScore cell. Requires Tracker v1.4.0 (aiScore column).
        var scCol = TRACKER_COLUMNS.indexOf('aiScore') + 1;
        if (scCol === 0) {
          return jsonOut_({ ok: false, error: 'aiScore column not found — update LocalizationTracker.gs to v1.4.0 and rebuild the tracker.' });
        }
        var scoreVal = Number(body.aiScore);
        if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
          return jsonOut_({ ok: false, error: 'aiScore must be a number between 0 and 100' });
        }
        trk.getRange(rowIndex, scCol).setValue(Math.round(scoreVal));
        return jsonOut_({ ok: true, mode: 'set_status', action: 'score',
                          translationKey: tkey, audience: audience || candidates[0].audience,
                          aiScore: Math.round(scoreVal) });
      }

      // action === 'complete':
      var auditedDate = String(body.auditedDate || '').trim();
      if (!auditedDate) {
        var today = new Date();
        auditedDate = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
      }
      var accuracy = (body.accuracy === undefined || body.accuracy === null) ? '' : String(body.accuracy);
      var notes    = (body.notes    === undefined || body.notes    === null) ? '' : String(body.notes);

      trk.getRange(rowIndex, stCol).setValue('audited');
      trk.getRange(rowIndex, adCol).setValue(auditedDate);
      if (accuracy) trk.getRange(rowIndex, acCol).setValue(accuracy);
      if (notes)    trk.getRange(rowIndex, noCol).setValue(notes);

      return jsonOut_({ ok: true, mode: 'set_status', action: 'complete',
                        translationKey: tkey, status: 'audited',
                        auditedDate: auditedDate });
    }

    if (mode === 'glossary_add') {
      if (!Array.isArray(body.items)) {
        return jsonOut_({ ok: false, error: 'Missing items array' });
      }
      if (body.items.length === 0) {
        return jsonOut_({ ok: true, mode: 'glossary_add', added: 0, conflicts: 0, skipped: 0 });
      }
      if (body.items.length > 200) {
        return jsonOut_({ ok: false, error: 'Too many items in one POST (max 200)' });
      }
      var sourceArticle = String(body.sourceArticle || '').trim();
      var gRes = glossaryAdd_(body.items, sourceArticle);
      return jsonOut_({ ok: true, mode: 'glossary_add',
                        added: gRes.added, conflicts: gRes.conflicts, skipped: gRes.skipped });
    }

    if (mode === 'glossary_resolve') {
      var resolveEn = String(body.en || '').trim();
      var winnerEs = String(body.winnerEs || '').trim();
      if (!resolveEn) return jsonOut_({ ok: false, error: 'Missing "en" (the conflict group term)' });
      if (!winnerEs) return jsonOut_({ ok: false, error: 'Missing "winnerEs" (the winning translation)' });
      var rRes = glossaryResolve_(resolveEn, winnerEs);
      if (!rRes.ok) return jsonOut_(rRes);
      return jsonOut_({ ok: true, mode: 'glossary_resolve', en: resolveEn,
                        winnerEs: rRes.winnerEs, winnerRow: rRes.winnerRow,
                        rejectedCount: rRes.rejectedCount });
    }

    if (mode === 'glossary_set_type') {
      var stEn = String(body.en || '').trim();
      var stEs = String(body.es || '').trim();
      if (!stEn) return jsonOut_({ ok: false, error: 'Missing "en" (the English term)' });
      if (!stEs) return jsonOut_({ ok: false, error: 'Missing "es" (the Spanish translation — needed to pick ONE row inside conflict groups)' });
      if (body.type === undefined || body.type === null) {
        return jsonOut_({ ok: false, error: 'Missing "type" (use "product", "ui", "term", or "" to clear)' });
      }
      var stType = String(body.type).trim().toLowerCase();
      if (stType !== '' && !GLOSSARY_VALID_TYPES[stType]) {
        return jsonOut_({ ok: false, error: 'Invalid type "' + body.type + '" — must be "product", "ui", "term", or "" to clear' });
      }
      var tRes = glossarySetType_(stEn, stEs, stType);
      if (!tRes.ok) return jsonOut_(tRes);
      return jsonOut_({ ok: true, mode: 'glossary_set_type', en: stEn, es: tRes.es,
                        type: stType, row: tRes.row, updated: 1 });
    }

    if (mode === 'slug_alias_add') {
      var pOld = String(body.oldSlug || '').trim();
      if (!pOld) return jsonOut_({ ok: false, error: 'Missing "oldSlug" (bare slug or full help.thumbtack.com URL)' });
      var sRes = slugAliasAdd_(pOld, String(body.source || 'webapp-post'));
      if (!sRes.ok) return jsonOut_({ ok: false, mode: 'slug_alias_add', oldSlug: sRes.oldSlug || pOld, error: sRes.error });
      return jsonOut_({ ok: true, mode: 'slug_alias_add', oldSlug: sRes.oldSlug,
                        currentSlug: sRes.currentSlug, cached: !!sRes.cached,
                        currentUrl: 'https://help.thumbtack.com/article/' + sRes.currentSlug,
                        note: sRes.note || '' });
    }

    return jsonOut_({ ok: false, error: 'Unknown POST mode: ' + mode });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}


/* ================================================================
 * TYPE SETTER (v1.9.7)
 * Reclassifies ONE glossary row's type, matched by en + es (both,
 * normalized) — so a single variant inside a conflict group can be
 * typed without touching its siblings. Writes ONLY the type column.
 * Never changes status, never promotes, never deletes. Errors
 * instead of guessing when the row is not found or is ambiguous.
 * ================================================================ */
function glossarySetType_(en, es, type) {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var sh = ss.getSheetByName(GLOSSARY_TAB_NAME);
  if (!sh || sh.getLastRow() < 2) {
    return { ok: false, error: 'glossary_auto tab is empty or missing.' };
  }

  var iEn = GLOSSARY_COLUMNS.indexOf('en');
  var iEs = GLOSSARY_COLUMNS.indexOf('es');
  var iTy = GLOSSARY_COLUMNS.indexOf('type');

  var n = sh.getLastRow() - 1;
  var vals = sh.getRange(2, 1, n, GLOSSARY_COLUMNS.length).getValues();

  var wantEn = normalize_(en);
  var wantEs = normalize_(es);

  var matches = [];
  for (var r = 0; r < n; r++) {
    if (normalize_(vals[r][iEn]) === wantEn && normalize_(vals[r][iEs]) === wantEs) {
      matches.push({ row: r + 2, es: String(vals[r][iEs] || '') });
    }
  }

  if (matches.length === 0) {
    return { ok: false, error: 'No glossary row found for en="' + en + '" + es="' + es + '"' };
  }
  if (matches.length > 1) {
    // Exact duplicate pairs should not exist (dedupe prevents them), but
    // if they do, refuse and report instead of writing blindly.
    var rowsList = matches.map(function (m) { return m.row; }).join(', ');
    return { ok: false, error: 'Found ' + matches.length + ' identical rows for en="' + en +
                        '" + es="' + es + '" (sheet rows: ' + rowsList + '). Fix the duplicates manually first.' };
  }

  sh.getRange(matches[0].row, iTy + 1).setValue(type);
  return { ok: true, es: matches[0].es, row: matches[0].row };
}


/* ================================================================
 * CONFLICT RESOLVER (v1.9.5)
 * Marks the winner of a conflict group as 'manual' and every OTHER
 * row sharing the same EN term as 'rejected'. glossary_auto ONLY.
 * Rows are NEVER deleted (rejected = blacklist for the dedupe).
 * Errors instead of guessing when the group or winner isn't found.
 * ================================================================ */
function glossaryResolve_(en, winnerEs) {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var sh = ss.getSheetByName(GLOSSARY_TAB_NAME);
  if (!sh || sh.getLastRow() < 2) {
    return { ok: false, error: 'glossary_auto tab is empty or missing.' };
  }

  var iEn = GLOSSARY_COLUMNS.indexOf('en');
  var iEs = GLOSSARY_COLUMNS.indexOf('es');
  var iSt = GLOSSARY_COLUMNS.indexOf('status');

  var n = sh.getLastRow() - 1;
  var vals = sh.getRange(2, 1, n, GLOSSARY_COLUMNS.length).getValues();

  var wantEn = normalize_(en);
  var wantEs = normalize_(winnerEs);

  // Collect the whole group (every row sharing this EN term).
  var group = [];
  for (var r = 0; r < n; r++) {
    if (normalize_(vals[r][iEn]) === wantEn) {
      group.push({ index: r, row: r + 2, es: String(vals[r][iEs] || ''), status: String(vals[r][iSt] || '') });
    }
  }

  if (group.length === 0) {
    return { ok: false, error: 'No glossary rows found for EN term: "' + en + '"' };
  }
  if (group.length === 1) {
    return { ok: false, error: 'Term "' + en + '" has a single row (' + group[0].es + ') — no conflict to resolve.' };
  }

  // Find the winner inside the group.
  var winner = null;
  for (var g = 0; g < group.length; g++) {
    if (normalize_(group[g].es) === wantEs) { winner = group[g]; break; }
  }
  if (!winner) {
    var opts = group.map(function (x) { return '"' + x.es + '"'; }).join(', ');
    return { ok: false, error: 'winnerEs "' + winnerEs + '" not found in the group for "' + en +
                        '". Variants: ' + opts };
  }

  // Write: winner -> manual, everyone else -> rejected.
  var rejectedCount = 0;
  for (var k = 0; k < group.length; k++) {
    var item = group[k];
    if (item.index === winner.index) {
      if (item.status.toLowerCase() !== 'manual') {
        sh.getRange(item.row, iSt + 1).setValue('manual');
      }
    } else {
      if (item.status.toLowerCase() !== 'rejected') {
        sh.getRange(item.row, iSt + 1).setValue('rejected');
        rejectedCount++;
      }
    }
  }

  return { ok: true, winnerEs: winner.es, winnerRow: winner.row, rejectedCount: rejectedCount };
}


/* ================================================================
 * GLOSSARY WRITER
 * Dedupes against the existing glossary_auto tab and appends new rows
 * in ONE write. Creates the tab (with header) on first use.
 * Rules: exact pair exists -> skipped; same EN different ES -> conflict.
 * v1.9.6: accepts an optional per-item "type" (product|ui|term).
 * NOTE: 'rejected' rows participate in dedupe on purpose — they act as
 * a blacklist so resolved conflicts never come back.
 * ================================================================ */
function glossaryAdd_(items, sourceArticle) {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var sh = ss.getSheetByName(GLOSSARY_TAB_NAME);
  if (!sh) {
    sh = ss.insertSheet(GLOSSARY_TAB_NAME);
    sh.getRange(1, 1, 1, GLOSSARY_COLUMNS.length).setValues([GLOSSARY_COLUMNS]);
    sh.setFrozenRows(1);
  }

  // Load existing pairs for dedupe: norm(en) -> { norm(es): true }
  var existing = {};
  var last = sh.getLastRow();
  if (last > 1) {
    var vals = sh.getRange(2, 1, last - 1, 2).getValues();
    for (var r = 0; r < vals.length; r++) {
      var enN0 = normalize_(vals[r][0]);
      var esN0 = normalize_(vals[r][1]);
      if (!enN0) continue;
      if (!existing[enN0]) existing[enN0] = {};
      existing[enN0][esN0] = true;
    }
  }

  var now = new Date().toISOString().slice(0, 10);
  var newRows = [];
  var added = 0, conflicts = 0, skipped = 0;

  for (var i = 0; i < items.length; i++) {
    var it = items[i] || {};
    var en = String(it.en || '').trim();
    var es = String(it.es || '').trim();
    var ctx = String(it.context || '').trim();
    if (!en || !es) { skipped++; continue; }
    // Sanity caps: terms, not paragraphs.
    if (en.length > 80 || es.length > 80) { skipped++; continue; }

    // v1.9.6: optional type, validated. Invalid/missing -> stored empty.
    var typ = String(it.type || '').trim().toLowerCase();
    if (!GLOSSARY_VALID_TYPES[typ]) typ = '';

    var enN = normalize_(en);
    var esN = normalize_(es);

    if (existing[enN] && existing[enN][esN]) { skipped++; continue; }   // exact pair exists

    var status = 'auto';
    if (existing[enN]) { status = 'conflict'; conflicts++; }            // same EN, different ES
    else { added++; }

    newRows.push([en, es, ctx, sourceArticle, now, status, typ]);

    // Register so duplicates WITHIN this same batch also dedupe.
    if (!existing[enN]) existing[enN] = {};
    existing[enN][esN] = true;
  }

  if (newRows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, newRows.length, GLOSSARY_COLUMNS.length).setValues(newRows);
  }

  return { added: added, conflicts: conflicts, skipped: skipped };
}


/* ================================================================
 * READERS
 * ================================================================ */

// Light list: every row EXCEPT the heavy fullText column.
function readLightRows_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var ftIndex = COLUMNS.indexOf('fullText');     // last column
  var lightCount = (ftIndex === COLUMNS.length - 1) ? COLUMNS.length - 1 : COLUMNS.length;
  var values = sheet.getRange(2, 1, lastRow - 1, lightCount).getValues();

  var out = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    if (!row[0]) continue;
    var obj = {};
    for (var c = 0; c < lightCount; c++) {
      if (COLUMNS[c] === 'fullText') continue;
      obj[COLUMNS[c]] = row[c];
    }
    out.push(obj);
  }
  return out;
}

// Full records for specific docIds (includes fullText).
function readFullByIds_(sheet, ids) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var want = {};
  ids.forEach(function (id) { want[id] = true; });

  var values = sheet.getRange(2, 1, lastRow - 1, COLUMNS.length).getValues();
  var out = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    var docId = row[0];
    if (!docId || !want[docId]) continue;
    var obj = {};
    for (var c = 0; c < COLUMNS.length; c++) {
      obj[COLUMNS[c]] = row[c];
    }
    out.push(obj);
  }
  return out;
}

// WRITE: set summary / concepts / aliases on existing rows, matched by docId.
function enrichRows_(sheet, items) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { updated: 0, notFound: items.length };

  var idCol   = COLUMNS.indexOf('docId') + 1;
  var sumCol  = COLUMNS.indexOf('summary') + 1;
  var concCol = COLUMNS.indexOf('concepts') + 1;
  var aliCol  = COLUMNS.indexOf('aliases') + 1;

  var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  var rowOf = {};
  for (var r = 0; r < ids.length; r++) {
    var id = String(ids[r][0] || '').trim();
    if (id) rowOf[id] = r + 2;
  }

  var updated = 0, notFound = 0;
  for (var i = 0; i < items.length; i++) {
    var it = items[i] || {};
    var did = String(it.docId || '').trim();
    var row = rowOf[did];
    if (!row) { notFound++; continue; }

    var summary  = (it.summary  === undefined || it.summary  === null) ? '' : String(it.summary);
    var concepts = (it.concepts === undefined || it.concepts === null) ? '' : String(it.concepts);
    var aliases  = (it.aliases  === undefined || it.aliases  === null) ? '' : String(it.aliases);

    if (concCol === sumCol + 1 && aliCol === sumCol + 2) {
      sheet.getRange(row, sumCol, 1, 3).setValues([[summary, concepts, aliases]]);
    } else {
      sheet.getRange(row, sumCol).setValue(summary);
      sheet.getRange(row, concCol).setValue(concepts);
      sheet.getRange(row, aliCol).setValue(aliases);
    }
    updated++;
  }
  return { updated: updated, notFound: notFound };
}

// Tokenized text search across title + aliases + concepts + headings + fullText.
var STOPWORDS = {
  'the':1,'a':1,'an':1,'to':1,'of':1,'for':1,'on':1,'in':1,'and':1,'or':1,'is':1,'are':1,
  'how':1,'do':1,'i':1,'my':1,'me':1,'with':1,'by':1,'at':1,'as':1,'it':1,'this':1,'that':1,
  'el':1,'la':1,'los':1,'las':1,'un':1,'una':1,'de':1,'del':1,'para':1,'por':1,'con':1,'en':1,
  'y':1,'o':1,'como':1,'que':1,'mi':1,'mis':1,'su':1,'sus':1,'se':1,'al':1,'lo':1,
  'um':1,'uma':1,'do':1,'da':1,'dos':1,'das':1,'com':1,'em':1,
  'steps':1,'step':1,'pasos':1,'paso':1
};

function tokenize_(norm) {
  return norm.split(/[^a-z0-9]+/)
    .filter(function (w) { return w.length >= 3 && !STOPWORDS[w]; });
}

function bodyTokensClose_(norm, toks, window) {
  var positions = [];
  for (var i = 0; i < toks.length; i++) {
    var p = norm.indexOf(toks[i]);
    if (p === -1) return false;
    positions.push(p);
  }
  var min = Math.min.apply(null, positions);
  var max = Math.max.apply(null, positions);
  return (max - min) <= window;
}


function searchCorpus_(sheet, query, languageFilter) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var idx = {};
  COLUMNS.forEach(function (c, i) { idx[c] = i; });

  var terms = String(query).split(',')
    .map(function (t) { return t.trim(); })
    .filter(Boolean)
    .map(function (t) {
      var norm = normalize_(t);
      return { raw: t, norm: norm, tokens: tokenize_(norm) };
    })
    .filter(function (t) { return t.norm.length > 0; });
  if (terms.length === 0) return [];

  var W_TITLE = 10, W_ALIASES = 7, W_CONCEPTS = 5, W_HEADINGS = 4, W_BODY = 1;
  var TOKEN_FRACTION = 0.5;
  var PHRASE_BONUS = 2;

  var values = sheet.getRange(2, 1, lastRow - 1, COLUMNS.length).getValues();
  var out = [];

  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    if (!row[idx.docId]) continue;

    // Language filter applied BEFORE scoring and BEFORE the cap.
    if (languageFilter &&
        String(row[idx.language] || '').toUpperCase() !== languageFilter) continue;

    var title = String(row[idx.title] || '');
    var headings = String(row[idx.headings] || '');
    var concepts = String(row[idx.concepts] || '');
    var aliases = String(row[idx.aliases] || '');
    var fullText = String(row[idx.fullText] || '');

    var fields = [
      { name: 'title',    norm: normalize_(title),    w: W_TITLE },
      { name: 'aliases',  norm: normalize_(aliases),  w: W_ALIASES },
      { name: 'concepts', norm: normalize_(concepts), w: W_CONCEPTS },
      { name: 'headings', norm: normalize_(headings), w: W_HEADINGS },
      { name: 'body',     norm: normalize_(fullText), w: W_BODY }
    ];

    var matchedTerms = [];
    var matchIn = '';
    var bodyPos = -1;
    var score = 0;

    for (var t = 0; t < terms.length; t++) {
      var term = terms[t];
      var toks = term.tokens.length ? term.tokens : [term.norm];
      var multiWord = toks.length >= 2;

      var termScore = 0;
      var termBestField = '';
      var termBestRank = 99;
      var termPhraseHit = false;
      var termMaxTokensStrong = 0;
      var termBodyProximity = false;
      var termBodyPos = -1;
      var hitTitleField = false;
      var hitConceptsField = false;
      var hitHeadingsField = false;

      for (var f = 0; f < fields.length; f++) {
        var fld = fields[f];
        if (!fld.norm) continue;

        var isStrong = (fld.name === 'title' || fld.name === 'aliases' ||
                        fld.name === 'concepts' || fld.name === 'headings');

        var phraseHit = term.norm.length > 0 && fld.norm.indexOf(term.norm) !== -1;

        var hitCount = 0;
        for (var k = 0; k < toks.length; k++) {
          if (fld.norm.indexOf(toks[k]) !== -1) hitCount++;
        }

        if (phraseHit || hitCount > 0) {
          var contrib = 0;
          if (phraseHit) contrib += fld.w + PHRASE_BONUS;
          if (hitCount > 0) {
            var coverage = hitCount / toks.length;
            contrib += fld.w * TOKEN_FRACTION * coverage;
          }
          termScore += contrib;

          if (f < termBestRank) { termBestRank = f; termBestField = fld.name; }
          if (phraseHit) termPhraseHit = true;
          if (isStrong && hitCount > termMaxTokensStrong) termMaxTokensStrong = hitCount;
          if (fld.name === 'title') hitTitleField = true;
          if (fld.name === 'concepts') hitConceptsField = true;
          if (fld.name === 'headings') hitHeadingsField = true;

          if (fld.name === 'body') {
            if (multiWord && hitCount === toks.length) {
              termBodyProximity = bodyTokensClose_(fld.norm, toks, 80);
            }
            if (termBodyPos === -1) {
              var firstTok = (phraseHit ? term.norm : toks[0]);
              var p = fld.norm.indexOf(firstTok);
              if (p !== -1) termBodyPos = p;
            }
          }
        }
      }

      var qualifies;
      if (multiWord) {
        qualifies = termPhraseHit || (termMaxTokensStrong >= 2) || termBodyProximity;
      } else {
        qualifies = termScore > 0;
      }
      if (!qualifies) continue;

      if (hitTitleField && hitConceptsField) termScore += 3;
      else if (hitTitleField && hitHeadingsField) termScore += 1.5;

      score += termScore;
      matchedTerms.push(term.raw);
      if (!matchIn) matchIn = termBestField;
      if (bodyPos === -1 && termBodyPos !== -1) bodyPos = termBodyPos;
    }

    if (matchedTerms.length === 0) continue;
    if (score < MIN_SCORE) continue;

    score = Math.round(score * 100) / 100;

    var snippet = '';
    if (bodyPos !== -1) {
      var start = Math.max(0, bodyPos - SNIPPET_RADIUS);
      var end = Math.min(fullText.length, bodyPos + SNIPPET_RADIUS + 20);
      snippet = (start > 0 ? '\u2026' : '') + fullText.slice(start, end).replace(/\s+/g, ' ').trim() + (end < fullText.length ? '\u2026' : '');
    } else if (matchIn === 'aliases') {
      snippet = aliases;
    } else if (matchIn === 'concepts') {
      snippet = concepts;
    } else if (matchIn === 'headings') {
      snippet = headings;
    } else {
      snippet = title;
    }

    out.push({
      docId: row[idx.docId],
      title: title,
      url: row[idx.url],
      lane: row[idx.lane],
      audience: row[idx.audience],
      language: row[idx.language],
      headings: headings,
      wordCount: row[idx.wordCount],
      topicId: row[idx.topicId],
      topicRole: row[idx.topicRole],
      concepts: concepts,
      aliases: aliases,
      matchIn: matchIn,
      matchedTerms: matchedTerms,
      score: score,
      snippet: snippet
    });
  }

  out.sort(function (a, b) { return b.score - a.score; });
  if (out.length > MAX_RESULTS) out = out.slice(0, MAX_RESULTS);
  return out;
}


/* ================================================================
 * HELPERS
 * ================================================================ */
function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalize_(s) {
  if (s === null || s === undefined) return '';
  var str = String(s).toLowerCase();
  if (str.normalize) {
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  return str;
}

function setWebAppSecret() {
  PropertiesService.getScriptProperties().setProperty(WEBAPP_SECRET_PROP, 'CHANGE-ME-TO-A-SECRET');
  Logger.log('Web app secret set. Callers must now pass &key=YOUR-SECRET');
}