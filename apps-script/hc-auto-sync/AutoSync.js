/**
 * HC Auto Sync — AutoSync.gs  (CONSOLIDATED, single project)
 * v2.6.0
 *
 * v2.6.0 changes (TABLES + HYPERLINKS):
 *  - Embedded "table" entries (fields.table.tableData) are now written as real
 *    Google Docs tables (first row bold as header).
 *  - Hyperlinks are kept: "hyperlink" uses data.uri, "entry-hyperlink" resolves
 *    to https://help.thumbtack.com/article/<slug> (segments link to the current
 *    article), "asset-hyperlink" uses the asset file URL.
 *  - List items now keep bold/italic/links.
 *  - Fixed run-offset bug: whitespace is cleaned per run.
 *  - Content hash now includes links and table rows. NOTE: the first run after
 *    this change rewrites (almost) every Doc once, so they all get tables/links.
 *
 * v2.6.1 changes (MOVED / RETIRED articles):
 *  - When a slug is not in Contentful, the sync now checks the live Help Center
 *    URL. If it redirects to a new /article/<slug> that exists in Contentful,
 *    the sheet row is updated to the new URL and the existing Doc is refreshed
 *    (header gets the new slug). Logged as "moved".
 *  - If there is no redirect, the article is marked "retired" (unpublished or
 *    deleted). Retired rows are reported in their own email section, not as
 *    failures, and the Doc is never touched or deleted automatically.
 *  - checkFailedSlugs() lets you test any slugs by hand from the editor.
 *
 * v2.5.0: auto-create Docs for brand-new sheet rows.
 * v2.4.0: rename Drive file when the article title changes.
 * v2.3.0: content-hash change detection, LockService, zombie-restart guard.
 *
 * Sheet structure (SHEET_ID):
 *   Tab 'Articles':    A=URL  B=Last updatedAt (ISO, display only)
 *                      C=Last log  D=Cached doc fileId  E=Content hash
 *   Tab 'Run History': A=Datetime  B=Type  C=Updated  D=Failed
 *                      E=No change  F=Duration  G=Log text
 */

// ============================================================
// CONFIG
// ============================================================

var FOLDER_ID             = '1Eh0jaXmPFWx-YjntLh73xxdWni32IeqP';

var SHEET_ID              = '1_Ei7R5-BgWBiYySa0dxNS-fYq3ppTj9jlbofMKLYVOM';
var SHEET_TAB_ARTICLES    = 'Articles';
var SHEET_TAB_HISTORY     = 'Run History';

var CONTENTFUL_SPACE_ID   = 'zkjkphkd3oqx';
var CONTENTFUL_ENV        = 'master';
var CONTENTFUL_TOKEN      = 'wYRv1oJP9HTiR8n_YD_qcdIrJBCPv1bBkOIscTmOSWE';
var CONTENTFUL_BASE       = 'https://cdn.contentful.com/spaces/' + CONTENTFUL_SPACE_ID +
                            '/environments/' + CONTENTFUL_ENV;

var HC_ARTICLE_BASE       = 'https://help.thumbtack.com/article/';

var SHARED_SECRET         = 'Aut0Sync-X9kP2mQvLnT4wRjF7cBdE6hY';

var AUTO_REVIEWER         = 'Auto Sync';
var MANUAL_REVIEWER       = 'Manual Sync';
var MAX_DESCRIPTION_CHARS = 24000;

var BATCH_SIZE            = 50;
var BATCH_INTERVAL_MIN    = 4;
var MAX_BATCH_MS          = 300000;
var TICK_INTERVAL_MIN     = 10;
var CHAIN_STALL_MIN       = 8;

var NOTIFY_EMAIL          = 'jcardona@thumbtack.com';

var _DOC_INDEX = null;


// ============================================================
// WEB APP
// ============================================================

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('HC Auto Sync')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


// ============================================================
// UI FUNCTIONS
// ============================================================

function getSheetUrl() {
  return SpreadsheetApp.openById(SHEET_ID).getUrl();
}

function getArticleList() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_TAB_ARTICLES);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data    = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var results = [];

  data.forEach(function(row) {
    var url = (row[0] || '').toString().trim();
    if (!url || url.toLowerCase() === 'url') return;

    var slug = extractSlugFromUrl(url);
    if (!slug) return;

    var fileId = (row[3] || '').toString().trim();

    results.push({
      url:           url,
      slug:          slug,
      lastUpdatedAt: (row[1] || '').toString().trim(),
      lastLog:       (row[2] || '').toString().trim(),
      docUrl:        fileId ? ('https://docs.google.com/document/d/' + fileId + '/edit') : '',
    });
  });

  return results;
}

function getRunStatus() {
  var props      = PropertiesService.getScriptProperties();
  var phase      = props.getProperty('AS_PHASE')              || 'idle';
  var checkpoint = parseInt(props.getProperty('AS_CHECKPOINT') || '-1', 10);
  var totalRows  = parseInt(props.getProperty('AS_TOTAL_ROWS') || '0',  10);
  var updated    = JSON.parse(props.getProperty('AS_UPDATED')  || '[]');
  var failed     = JSON.parse(props.getProperty('AS_FAILED')   || '[]');
  var noChange   = parseInt(props.getProperty('AS_NO_CHANGE')  || '0',  10);
  var lastSlug   = props.getProperty('AS_LAST_SLUG')           || '';
  var runType    = props.getProperty('AS_RUN_TYPE')            || '';
  var runDate    = props.getProperty('AS_RUN_DATE')            || '';

  var running      = (phase === 'starting' || phase === 'running');
  var starting     = (phase === 'starting');
  var checked      = checkpoint >= 0 ? checkpoint : 0;
  var pct          = totalRows > 0 ? Math.round(checked / totalRows * 100) : 0;
  var totalBatches = Math.max(1, Math.ceil(totalRows / BATCH_SIZE));
  var currentBatch = Math.min(Math.max(1, Math.ceil((checked || 1) / BATCH_SIZE)), totalBatches);

  return {
    running:      running,
    starting:     starting,
    phase:        phase,
    runType:      runType,
    runDate:      runDate,
    currentBatch: currentBatch,
    totalBatches: totalBatches,
    checked:      checked,
    total:        totalRows,
    pct:          pct,
    updated:      updated.length,
    failed:       failed.length,
    noChange:     noChange,
    lastSlug:     lastSlug,
  };
}

function getRunHistory() {
  var sheet   = _getOrCreateHistorySheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var startRow = Math.max(2, lastRow - 18);
  var numRows  = lastRow - startRow + 1;
  var data     = sheet.getRange(startRow, 1, numRows, 7).getValues();

  var results = [];
  for (var i = data.length - 1; i >= 0; i--) {
    var row = data[i];
    if (!row[0]) continue;
    results.push({
      datetime: row[0].toString(),
      type:     row[1].toString(),
      updated:  parseInt(row[2], 10) || 0,
      failed:   parseInt(row[3], 10) || 0,
      noChange: parseInt(row[4], 10) || 0,
      duration: row[5].toString(),
      log:      row[6].toString(),
    });
  }
  return results;
}

function syncSingleArticle(url) {
  try {
    url = (url || '').trim();
    if (!url) return { ok: false, error: 'URL is required.' };

    var slug = extractSlugFromUrl(url);
    if (!slug) return { ok: false, error: 'Could not extract slug from URL.' };

    var article = fetchArticleFromContentful(slug);
    if (!article) {
      return { ok: false, error: 'Article not found in Contentful (slug: ' + slug + ').' };
    }

    var result = refreshArticle({
      url:         url,
      mode:        'update',
      reviewer:    MANUAL_REVIEWER,
      publishDate: getTodayDateInternal(),
      oldUrl:      '',
    });

    var blocks = parseArticleToBlocks(article);
    _setStoredHash(url, _computeContentHash(blocks));

    _updateSheetRow(url, article.latestContentUpdate,
      getTodayDateInternal() + ' — synced manually');

    return {
      ok:            true,
      docUrl:        result.docUrl,
      lastUpdatedAt: article.latestContentUpdate,
    };

  } catch (e) {
    var msg = e.message || String(e);
    Logger.log('syncSingleArticle error: ' + msg + '\n' + (e.stack || ''));
    try {
      var parsed = JSON.parse(msg);
      return { ok: false, error: parsed.message || msg };
    } catch (_) {}
    return { ok: false, error: msg };
  }
}

function tick() {
  var props = PropertiesService.getScriptProperties();
  var phase = props.getProperty('AS_PHASE') || 'idle';

  if (phase !== 'starting' && phase !== 'running') {
    return;
  }

  var startMs = parseInt(props.getProperty('AS_RUN_START_MS') || '0', 10);
  if (startMs && (Date.now() - startMs) > 2 * 60 * 60 * 1000) {
    Logger.log('Run stuck > 2h — forcing finish.');
    var totalRows = parseInt(props.getProperty('AS_TOTAL_ROWS') || '0', 10);
    _finishRun(props, totalRows);
    return;
  }

  var lastBatchMs = parseInt(props.getProperty('AS_LAST_BATCH_MS') || '0', 10);
  var sinceLastMin = lastBatchMs ? (Date.now() - lastBatchMs) / 60000 : 999;
  if (sinceLastMin < CHAIN_STALL_MIN) {
    Logger.log('Tick: chain healthy (last batch ' + Math.round(sinceLastMin) +
      ' min ago) — sleeping.');
    return;
  }

  Logger.log('Tick: chain stalled (last batch ' + Math.round(sinceLastMin) +
    ' min ago) — resuming from checkpoint.');
  processBatch();
}

function runManualSync() {
  var props = PropertiesService.getScriptProperties();
  var phase = props.getProperty('AS_PHASE') || 'idle';

  if (phase === 'starting' || phase === 'running') {
    var startMs = parseInt(props.getProperty('AS_RUN_START_MS') || '0', 10);
    var ageMin  = startMs ? (Date.now() - startMs) / 60000 : 999;
    if (ageMin < 30) {
      return { ok: false, error: 'A sync is already running. Wait for it to finish.' };
    }
    Logger.log('Stale run state detected (' + Math.round(ageMin) + ' min old). Auto-resetting.');
  }

  _deleteBatchTrigger(props);
  _ensureTickTrigger();

  _initRunState(props, 'manual');

  try {
    processBatch();
  } catch (e) {
    Logger.log('First inline batch error (tick will resume): ' + e.message);
  }

  return { ok: true, message: 'Manual sync started.' };
}


// ============================================================
// BATCH ENGINE
// ============================================================

function runNightlySync() {
  var day = new Date().getUTCDay();
  if (day === 0 || day === 6) {
    Logger.log('Weekend — skipping.');
    return;
  }
  var props = PropertiesService.getScriptProperties();

  var phase = props.getProperty('AS_PHASE') || 'idle';
  if (phase === 'starting' || phase === 'running') {
    var startMs = parseInt(props.getProperty('AS_RUN_START_MS') || '0', 10);
    var ageMin  = startMs ? (Date.now() - startMs) / 60000 : 999;
    if (ageMin < 120) {
      Logger.log('A run is already in progress (' + Math.round(ageMin) +
        ' min) — skipping this nightly trigger.');
      return;
    }
    Logger.log('Stale run detected (' + Math.round(ageMin) + ' min) — re-initializing.');
  }

  _ensureTickTrigger();
  _initRunState(props, 'auto');
  processBatch();
}

function _initRunState(props, runType) {
  var today = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
  props.setProperties({
    AS_PHASE:            'starting',
    AS_CHECKPOINT:       '0',
    AS_TOTAL_ROWS:       '0',
    AS_RUN_TYPE:         runType,
    AS_RUN_DATE:         today,
    AS_RUN_START_MS:     Date.now().toString(),
    AS_UPDATED:          '[]',
    AS_FAILED:           '[]',
    AS_BASELINE:         '[]',
    AS_RETIRED:          '[]',
    AS_MOVED:            '[]',
    AS_NO_CHANGE:        '0',
    AS_LAST_SLUG:        '',
    AS_BATCH_TRIGGER_ID: '',
    AS_FAIL_STREAK:      '0',
    AS_LAST_BATCH_MS:    Date.now().toString(),
    AS_HISTORY_WRITTEN:  '',
  });
  Logger.log('Run state initialized (' + runType + ') for ' + today);
}

function processBatch() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    Logger.log('processBatch: another batch holds the lock — skipping this invocation.');
    return;
  }

  var props = PropertiesService.getScriptProperties();
  try {
    _processBatchInner();
    props.setProperty('AS_FAIL_STREAK', '0');
  } catch (fatalErr) {
    Logger.log('Batch error: ' + fatalErr.message + '\n' + (fatalErr.stack || ''));

    var streak = parseInt(props.getProperty('AS_FAIL_STREAK') || '0', 10) + 1;
    props.setProperty('AS_FAIL_STREAK', streak.toString());

    if (streak >= 5) {
      Logger.log('Batch failed ' + streak + ' times in a row — giving up.');
      _sendEmergencyEmail(fatalErr);
      props.setProperty('AS_CHECKPOINT', '-1');
      props.setProperty('AS_PHASE', 'done');
      props.setProperty('AS_FAIL_STREAK', '0');
    } else {
      Logger.log('Transient failure #' + streak + ' — tick() will retry from checkpoint.');
    }
  } finally {
    lock.releaseLock();
  }
}

function _processBatchInner() {
  var props      = PropertiesService.getScriptProperties();
  var phase      = props.getProperty('AS_PHASE') || 'idle';
  var checkpoint = parseInt(props.getProperty('AS_CHECKPOINT') || '0', 10);

  if (phase === 'done' || phase === 'idle' || checkpoint < 0) {
    Logger.log('_processBatchInner: nothing to do (phase=' + phase +
      ', checkpoint=' + checkpoint + ').');
    return;
  }

  _deleteBatchTrigger(props);

  props.setProperty('AS_PHASE', 'running');

  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_TAB_ARTICLES);
  if (!sheet) throw new Error('Articles tab not found in sheet ' + SHEET_ID);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('Sheet empty — finishing.');
    _finishRun(props, 0);
    return;
  }

  var totalDataRows = lastRow - 1;
  props.setProperty('AS_TOTAL_ROWS', totalDataRows.toString());

  if (checkpoint >= totalDataRows) {
    Logger.log('All rows processed — finishing.');
    _finishRun(props, totalDataRows);
    return;
  }

  var startRow  = checkpoint + 2;
  var batchRows = Math.min(BATCH_SIZE, totalDataRows - checkpoint);
  var data      = sheet.getRange(startRow, 1, batchRows, 5).getValues();

  var runLabel   = Utilities.formatDate(new Date(), 'UTC', 'MMM d HH:mm') + ' UTC';
  var batchStart = Date.now();

  var updated  = JSON.parse(props.getProperty('AS_UPDATED')  || '[]');
  var failed   = JSON.parse(props.getProperty('AS_FAILED')   || '[]');
  var baseline = JSON.parse(props.getProperty('AS_BASELINE') || '[]');
  var retired  = JSON.parse(props.getProperty('AS_RETIRED')  || '[]');
  var moved    = JSON.parse(props.getProperty('AS_MOVED')    || '[]');
  var noChange = parseInt(props.getProperty('AS_NO_CHANGE')  || '0', 10);

  var requestMap = [];
  for (var i = 0; i < data.length; i++) {
    var url = (data[i][0] || '').toString().trim();
    if (!url || url.toLowerCase() === 'url') { data[i][2] = ''; continue; }
    var slug = extractSlugFromUrl(url);
    if (!slug) { data[i][2] = runLabel + ' — skipped: bad URL'; continue; }
    var qs = 'content_type=helpCenterArticle' +
             '&fields.slug=' + encodeURIComponent(slug) + '&include=10';
    requestMap.push({
      rowIndex: i, slug: slug, url: url,
      cfRequest: {
        url:                CONTENTFUL_BASE + '/entries?' + qs,
        headers:            { 'Authorization': 'Bearer ' + CONTENTFUL_TOKEN },
        muteHttpExceptions: true,
      },
    });
  }

  var cfResponses = [];
  if (requestMap.length > 0) {
    cfResponses = UrlFetchApp.fetchAll(requestMap.map(function(r) { return r.cfRequest; }));
  }

  var rowsProcessed = 0;
  for (var j = 0; j < requestMap.length; j++) {
    if (Date.now() - batchStart > MAX_BATCH_MS) {
      Logger.log('Wall-clock limit hit after ' + rowsProcessed + ' rows — cutting batch.');
      break;
    }

    var item       = requestMap[j];
    var ri         = item.rowIndex;
    var sl         = item.slug;
    var u          = item.url;
    var storedHash = (data[ri][4] || '').toString().trim();
    var cfRes      = cfResponses[j];
    rowsProcessed++;

    if (cfRes.getResponseCode() !== 200) {
      var retryRes = _contentfulRetry(sl);
      if (!retryRes) {
        data[ri][2] = runLabel + ' — ERROR: Contentful HTTP ' + cfRes.getResponseCode();
        failed.push({ slug: sl, error: 'Contentful HTTP ' + cfRes.getResponseCode() });
        continue;
      }
      cfRes = retryRes;
    }

    var cfData;
    try {
      cfData = JSON.parse(cfRes.getContentText());
    } catch (parseErr) {
      data[ri][2] = runLabel + ' — ERROR: JSON parse failed';
      failed.push({ slug: sl, error: 'JSON parse error' });
      continue;
    }

    if (!cfData.items || cfData.items.length === 0) {
      // Slug gone from Contentful: was it renamed (HC redirects) or retired?
      var mv = _handleMissingSlug_(u, sl);
      if (mv.status === 'moved') {
        data[ri][0] = mv.newUrl;
        data[ri][1] = mv.updatedAt || '';
        data[ri][4] = mv.hash || '';
        data[ri][2] = runLabel + ' — moved to ' + mv.newSlug;
        moved.push({ slug: sl, newSlug: mv.newSlug, docUrl: mv.docUrl || '' });
      } else if (mv.status === 'retired') {
        data[ri][2] = runLabel + ' — RETIRED: not in Contentful, no redirect';
        retired.push(sl);
      } else {
        data[ri][2] = runLabel + ' — FAILED: ' + mv.error;
        failed.push({ slug: sl, error: mv.error });
      }
      props.setProperty('AS_LAST_SLUG', sl);
      continue;
    }

    var article, blocks, hash, latestUpdatedAt;
    try {
      article         = _articleFromCfData(cfData);
      blocks          = parseArticleToBlocks(article);
      hash            = _computeContentHash(blocks);
      latestUpdatedAt = article.latestContentUpdate || '';
    } catch (he) {
      data[ri][2] = runLabel + ' — ERROR: parse/hash failed: ' + he.message;
      failed.push({ slug: sl, error: 'parse/hash: ' + he.message });
      continue;
    }

    if (!storedHash) {
      var cres = _doCreateFromBlocks(u, sl, article, blocks);
      if (cres.ok) {
        Logger.log('[CREATED] ' + sl + ' (new article, no Doc existed)');
        data[ri][4] = hash;
        data[ri][1] = latestUpdatedAt;
        data[ri][2] = runLabel + ' — created';
        updated.push({ slug: sl, docUrl: cres.docUrl || '' });
      } else if (cres.code === 'ALREADY_EXISTS') {
        data[ri][4] = hash;
        data[ri][1] = latestUpdatedAt;
        data[ri][2] = runLabel + ' — baseline set';
        baseline.push(sl);
      } else {
        data[ri][2] = runLabel + ' — FAILED (create): ' + cres.error;
        failed.push({ slug: sl, error: 'create: ' + cres.error });
      }
      props.setProperty('AS_LAST_SLUG', sl);
      continue;
    }

    if (hash === storedHash) {
      data[ri][2] = runLabel + ' — no change';
      noChange++;
      props.setProperty('AS_LAST_SLUG', sl);
      continue;
    }

    Logger.log('[CHANGED] ' + sl + ' (content hash differs)');
    var result = _doUpdateFromBlocks(u, sl, article, blocks);
    if (result.ok) {
      data[ri][1] = latestUpdatedAt;
      data[ri][4] = hash;
      data[ri][2] = runLabel + ' — updated';
      updated.push({ slug: sl, docUrl: result.docUrl || '' });
    } else {
      data[ri][2] = runLabel + ' — FAILED: ' + result.error;
      failed.push({ slug: sl, error: result.error });
    }
    props.setProperty('AS_LAST_SLUG', sl);
  }

  var abc  = data.map(function(r) { return [r[0], r[1], r[2]]; });  // A may change (moved)
  var eCol = data.map(function(r) { return [r[4]]; });
  sheet.getRange(startRow, 1, batchRows, 3).setValues(abc);
  sheet.getRange(startRow, 5, batchRows, 1).setValues(eCol);

  var newCheckpoint;
  if (rowsProcessed < requestMap.length && rowsProcessed > 0) {
    var lastIdx   = requestMap[rowsProcessed - 1].rowIndex;
    newCheckpoint = checkpoint + lastIdx + 1;
  } else if (rowsProcessed === 0 && requestMap.length > 0) {
    newCheckpoint = checkpoint;
  } else {
    newCheckpoint = checkpoint + batchRows;
  }

  props.setProperties({
    AS_CHECKPOINT: newCheckpoint.toString(),
    AS_UPDATED:    JSON.stringify(updated),
    AS_FAILED:     JSON.stringify(failed),
    AS_BASELINE:   JSON.stringify(baseline),
    AS_RETIRED:    JSON.stringify(retired),
    AS_MOVED:      JSON.stringify(moved),
    AS_NO_CHANGE:  noChange.toString(),
    AS_LAST_BATCH_MS: Date.now().toString(),
  });

  Logger.log('Batch done. Checkpoint ' + checkpoint + ' -> ' + newCheckpoint + ' / ' + totalDataRows);

  if (newCheckpoint >= totalDataRows) {
    _finishRun(props, totalDataRows);
  } else {
    _scheduleNextBatch(props);
  }
}

function _articleFromCfData(cfData) {
  var includes = { entries: {}, assets: {} };
  ((cfData.includes || {}).Entry || []).forEach(function(e) { includes.entries[e.sys.id] = e; });
  ((cfData.includes || {}).Asset || []).forEach(function(a) { includes.assets[a.sys.id] = a; });

  var item   = cfData.items[0];
  var latest = item.sys.updatedAt || '';
  ((cfData.includes || {}).Entry || []).forEach(function(e) {
    var eu = (e.sys || {}).updatedAt || '';
    if (eu > latest) latest = eu;
  });

  return { item: item, includes: includes, latestContentUpdate: latest };
}

/**
 * SHA-256 over the RENDERED blocks, now including links and table rows.
 */
function _computeContentHash(blocks) {
  var sig = (blocks || []).map(function(b) {
    var parts = [b.type || '', b.text || ''];
    if (b.runs && b.runs.length) {
      parts.push(b.runs.map(function(r) {
        return (r.bold ? 'b' : '') + (r.italic ? 'i' : '') +
               (r.link ? '@' + r.link : '') + ':' + (r.text || '');
      }).join('~'));
    }
    if (b.rows) parts.push('T=' + JSON.stringify(b.rows));
    if (b.glyph != null)  parts.push('g=' + b.glyph);
    if (b.level != null)  parts.push('L' + b.level);
    return parts.join('\u00A7');
  }).join('\u00B6');

  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, sig, Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    var v = (bytes[i] < 0 ? bytes[i] + 256 : bytes[i]).toString(16);
    hex += (v.length === 1 ? '0' : '') + v;
  }
  return hex;
}

function _doUpdateFromBlocks(url, slug, article, blocks) {
  try {
    var fields  = article.item.fields || {};
    var title   = fields.title || 'Untitled';
    var normUrl = normalizeUrl(url);
    var lastMod = formatDateLong(article.latestContentUpdate);
    var result  = updateDoc(normUrl, slug, '', title, getTodayDateInternal(),
                            AUTO_REVIEWER, lastMod, blocks, url);
    return { ok: true, docUrl: result.docUrl || '' };
  } catch (e) {
    var msg = e.message || String(e);
    try { var parsed = JSON.parse(msg); return { ok: false, error: parsed.message || msg }; }
    catch (_) {}
    return { ok: false, error: msg };
  }
}

function _doCreateFromBlocks(url, slug, article, blocks) {
  try {
    var fields  = article.item.fields || {};
    var title   = fields.title || 'Untitled';
    var normUrl = normalizeUrl(url);
    var lastMod = formatDateLong(article.latestContentUpdate);
    var result  = createDoc(normUrl, slug, title, getTodayDateInternal(),
                            AUTO_REVIEWER, lastMod, blocks, fields, article);
    return { ok: true, docUrl: result.docUrl || '' };
  } catch (e) {
    var msg = e.message || String(e);
    try {
      var parsed = JSON.parse(msg);
      return { ok: false, code: parsed.code || '', error: parsed.message || msg };
    } catch (_) {}
    return { ok: false, code: '', error: msg };
  }
}

function _finishRun(props, totalRows) {
  var runStart = props.getProperty('AS_RUN_START_MS') || '';
  if (runStart && props.getProperty('AS_HISTORY_WRITTEN') === runStart) {
    props.setProperty('AS_CHECKPOINT', '-1');
    props.setProperty('AS_PHASE', 'done');
    Logger.log('_finishRun: history already written for this run — skipping duplicate.');
    return;
  }

  var updated  = JSON.parse(props.getProperty('AS_UPDATED')  || '[]');
  var failed   = JSON.parse(props.getProperty('AS_FAILED')   || '[]');
  var baseline = JSON.parse(props.getProperty('AS_BASELINE') || '[]');
  var retired  = JSON.parse(props.getProperty('AS_RETIRED')  || '[]');
  var moved    = JSON.parse(props.getProperty('AS_MOVED')    || '[]');
  var noChange = parseInt(props.getProperty('AS_NO_CHANGE')  || '0', 10);
  var runDate  = props.getProperty('AS_RUN_DATE')            || 'Unknown';
  var runType  = props.getProperty('AS_RUN_TYPE')            || 'auto';
  var startMs  = parseInt(props.getProperty('AS_RUN_START_MS') || '0', 10);

  var durationMin = startMs ? (Math.round((Date.now() - startMs) / 60000) + ' min') : 'unknown';

  var logLines = [];
  if (updated.length > 0) {
    logLines.push('Updated (' + updated.length + '): ' +
      updated.map(function(x) { return x.slug; }).join(', '));
  }
  if (failed.length > 0) {
    logLines.push('Failed (' + failed.length + '):');
    failed.forEach(function(f) { logLines.push('  ' + f.slug + ' -> ' + f.error); });
  }
  if (baseline.length > 0) {
    logLines.push('New baselines (' + baseline.length + '): ' + baseline.join(', '));
  }
  if (moved.length > 0) {
    logLines.push('Moved (' + moved.length + '): ' +
      moved.map(function(m) { return m.slug + ' -> ' + m.newSlug; }).join(', '));
  }
  if (retired.length > 0) {
    logLines.push('Retired, needs review (' + retired.length + '): ' + retired.join(', '));
  }
  logLines.push('No changes: ' + noChange);
  var logText = logLines.join('\n');

  props.setProperty('AS_HISTORY_WRITTEN', runStart);

  saveRunToHistory({
    datetime: runDate + ' · ' + (runType === 'auto' ? '2:00 AM UTC' : 'manual'),
    type:     runType,
    updated:  updated.length,
    failed:   failed.length,
    noChange: noChange,
    duration: durationMin,
    log:      logText,
  });

  props.setProperty('AS_CHECKPOINT', '-1');
  props.setProperty('AS_PHASE', 'done');

  _sendSummaryEmail(updated, failed, baseline, noChange, totalRows, runDate, durationMin, runType, moved, retired);

  Logger.log('Run finished. ' + updated.length + ' updated, ' + failed.length + ' failed.');
}

function _contentfulRetry(slug) {
  try {
    var qs  = 'content_type=helpCenterArticle' +
              '&fields.slug=' + encodeURIComponent(slug) + '&include=10';
    var res = UrlFetchApp.fetch(CONTENTFUL_BASE + '/entries?' + qs, {
      headers:            { 'Authorization': 'Bearer ' + CONTENTFUL_TOKEN },
      muteHttpExceptions: true,
    });
    return res.getResponseCode() === 200 ? res : null;
  } catch (e) {
    Logger.log('_contentfulRetry failed for ' + slug + ': ' + e.message);
    return null;
  }
}

function _scheduleNextBatch(props) {
  try {
    _deleteBatchTrigger(props);
    var trigger = ScriptApp.newTrigger('processBatch').timeBased().after(1000).create();
    props.setProperty('AS_BATCH_TRIGGER_ID', trigger.getUniqueId());
    Logger.log('Next batch scheduled (ASAP).');
  } catch (e) {
    Logger.log('_scheduleNextBatch error (tick will resume): ' + e.message);
  }
}

function _ensureTickTrigger() {
  try {
    var has = ScriptApp.getProjectTriggers().some(function(t) {
      return t.getHandlerFunction() === 'tick';
    });
    if (!has) {
      ScriptApp.newTrigger('tick').timeBased().everyMinutes(TICK_INTERVAL_MIN).create();
      Logger.log('Tick trigger installed: every ' + TICK_INTERVAL_MIN + ' min.');
    }
  } catch (e) {
    Logger.log('_ensureTickTrigger error: ' + e.message);
  }
}

function _deleteBatchTrigger(props) {
  try {
    ScriptApp.getProjectTriggers().forEach(function(t) {
      if (t.getHandlerFunction() === 'processBatch') {
        ScriptApp.deleteTrigger(t);
      }
    });
  } catch (e) { Logger.log('_deleteBatchTrigger error: ' + e.message); }
  if (props) props.setProperty('AS_BATCH_TRIGGER_ID', '');
}


// ============================================================
// EMAILS
// ============================================================

function _sendSummaryEmail(updated, failed, baseline, noChange, totalRows, runDate, duration, runType, moved, retired) {
  moved   = moved   || [];
  retired = retired || [];
  try {
    var lines = [
      'HC Auto Sync — ' + (runType === 'auto' ? 'Nightly' : 'Manual') + ' Run',
      'Date: ' + runDate,
      'Total articles checked: ' + totalRows,
      'Duration: ' + duration,
      '',
    ];

    if (updated.length > 0) {
      lines.push('UPDATED (' + updated.length + '):');
      updated.forEach(function(u) { lines.push('  • ' + u.slug + (u.docUrl ? '\n    ' + u.docUrl : '')); });
      lines.push('');
    }
    if (failed.length > 0) {
      lines.push('FAILED (' + failed.length + ') — will retry next run:');
      failed.forEach(function(f) { lines.push('  • ' + f.slug); lines.push('    Reason: ' + f.error); });
      lines.push('');
    }
    if (baseline.length > 0) {
      lines.push('NEW BASELINES (' + baseline.length + '):');
      baseline.forEach(function(s) { lines.push('  • ' + s); });
      lines.push('');
    }
    if (moved.length > 0) {
      lines.push('MOVED — slug changed, fixed automatically (' + moved.length + '):');
      moved.forEach(function(m) {
        lines.push('  • ' + m.slug + ' -> ' + m.newSlug + (m.docUrl ? '\n    ' + m.docUrl : ''));
      });
      lines.push('');
    }
    if (retired.length > 0) {
      lines.push('RETIRED — not in Contentful and no redirect, NEEDS REVIEW (' + retired.length + '):');
      retired.forEach(function(s) { lines.push('  • ' + s + '  (' + HC_ARTICLE_BASE + s + ')'); });
      lines.push('  Check if these were unpublished on purpose. If yes, remove the row from');
      lines.push('  the Articles tab and move the Doc out of the content index folder.');
      lines.push('');
    }
    lines.push('NO CHANGES: ' + noChange + ' articles');

    var subject = 'HC Sync ' + runDate + ' — ' + updated.length + ' updated' +
      (failed.length > 0 ? ', ' + failed.length + ' failed' : ', all good');

    MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: subject, body: lines.join('\n') });
    Logger.log('Summary email sent.');
  } catch (e) { Logger.log('_sendSummaryEmail error: ' + e.message); }
}

function _sendEmergencyEmail(err) {
  try {
    var props   = PropertiesService.getScriptProperties();
    var runDate = props.getProperty('AS_RUN_DATE') || 'Unknown';
    var cp      = props.getProperty('AS_CHECKPOINT') || '?';
    MailApp.sendEmail({
      to:      NOTIFY_EMAIL,
      subject: 'CRASH — HC Auto Sync — ' + runDate,
      body: [
        'The HC Auto Sync batch crashed unexpectedly.',
        '', 'Date: ' + runDate, 'Checkpoint: row ' + cp, 'Error: ' + err.message,
        '', err.stack || 'No stack trace.',
        '', 'The nightly trigger is still installed and will retry tomorrow.',
        'If this keeps happening, run emergencyStop() from the editor.',
      ].join('\n'),
    });
  } catch (_) { Logger.log('Could not send emergency email.'); }
}


// ============================================================
// MAIN ENTRY POINT — refreshArticle
// ============================================================

function refreshArticle(formData) {
  var url         = (formData.url         || '').trim();
  var mode        = (formData.mode        || 'update').trim();
  var reviewer    = (formData.reviewer    || AUTO_REVIEWER).trim();
  var publishDate = (formData.publishDate || '').trim() || getTodayDateInternal();
  var oldUrl      = (formData.oldUrl      || '').trim();

  if (!url)      throw new Error('URL is required.');
  if (!reviewer) throw new Error('Reviewer is required.');

  var slug = extractSlugFromUrl(url);
  if (!slug) throw new Error('Could not extract slug from URL: ' + url);

  var article = fetchArticleFromContentful(slug);
  if (!article) {
    throw new Error('Article not found in Contentful (slug: ' + slug + '). ' +
      'Make sure the URL points to a published Help Center article.');
  }

  var blocks          = parseArticleToBlocks(article);
  var fields          = article.item.fields || {};
  var title           = fields.title || 'Untitled';
  var normalizedUrl   = normalizeUrl(url);
  var lastModifiedStr = formatDateLong(article.latestContentUpdate);

  if (mode === 'create') {
    return createDoc(normalizedUrl, slug, title, publishDate, reviewer,
                     lastModifiedStr, blocks, fields, article);
  }
  return updateDoc(normalizedUrl, slug, oldUrl, title, publishDate,
                   reviewer, lastModifiedStr, blocks, url);
}


// ============================================================
// HISTORY HELPERS
// ============================================================

function saveRunToHistory(summary) {
  try {
    var sheet = _getOrCreateHistorySheet();
    sheet.appendRow([
      summary.datetime || new Date().toISOString(),
      summary.type     || 'auto',
      summary.updated  || 0,
      summary.failed   || 0,
      summary.noChange || 0,
      summary.duration || '',
      summary.log      || '',
    ]);
  } catch (e) { Logger.log('saveRunToHistory error: ' + e.message); }
}

function _getOrCreateHistorySheet() {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_TAB_HISTORY);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TAB_HISTORY);
    sheet.appendRow(['Datetime','Type','Updated','Failed','No Change','Duration','Log']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(7, 600);
  }
  return sheet;
}

function _findArticleRow_(url) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_TAB_ARTICLES);
  if (!sheet) return null;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var rows    = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var normUrl = normalizeUrl(url);
  for (var i = 0; i < rows.length; i++) {
    if (normalizeUrl((rows[i][0] || '').toString().trim()) === normUrl) {
      return { sheet: sheet, row: i + 2, values: rows[i] };
    }
  }
  return null;
}

function _updateSheetRow(url, newTimestamp, logMessage) {
  try {
    var f = _findArticleRow_(url);
    if (!f) return;
    f.sheet.getRange(f.row, 2).setValue(newTimestamp);
    f.sheet.getRange(f.row, 3).setValue(logMessage);
  } catch (e) { Logger.log('_updateSheetRow error: ' + e.message); }
}

function _getCachedFileId(url) {
  try {
    var f = _findArticleRow_(url);
    return f ? (f.values[3] || '').toString().trim() : '';
  } catch (e) { Logger.log('_getCachedFileId error: ' + e.message); }
  return '';
}

function _setCachedFileId(url, fileId) {
  try {
    if (!fileId) return;
    var f = _findArticleRow_(url);
    if (f) f.sheet.getRange(f.row, 4).setValue(fileId);
  } catch (e) { Logger.log('_setCachedFileId error: ' + e.message); }
}

function _setStoredHash(url, hash) {
  try {
    if (!hash) return;
    var f = _findArticleRow_(url);
    if (f) f.sheet.getRange(f.row, 5).setValue(hash);
  } catch (e) { Logger.log('_setStoredHash error: ' + e.message); }
}

function _openCachedDocFile(fileId) {
  if (!fileId) return null;
  try {
    var file = DriveApp.getFileById(fileId);
    if (file.isTrashed()) return null;
    return file;
  } catch (e) {
    return null;
  }
}


// ============================================================
// POST HANDLER
// ============================================================

function doPost(e) {
  try {
    var req;
    try { req = JSON.parse(e.postData.contents); }
    catch (_) { return _jsonResponse({ ok: false, error: 'Invalid JSON body', code: 'BAD_REQUEST' }); }

    if (!req.secret || req.secret !== SHARED_SECRET) {
      return _jsonResponse({ ok: false, error: 'Unauthorized', code: 'BAD_SECRET' });
    }

    if (req.action === 'sync_single') {
      if (!req.url) return _jsonResponse({ ok: false, error: 'Missing url', code: 'BAD_REQUEST' });
      return _jsonResponse(syncSingleArticle(req.url));
    }

    if (req.action === 'run_manual') {
      return _jsonResponse(runManualSync());
    }

    if (req.action === 'save_history') {
      if (!req.summary) return _jsonResponse({ ok: false, error: 'Missing summary', code: 'BAD_REQUEST' });
      saveRunToHistory(req.summary);
      return _jsonResponse({ ok: true });
    }

    if (!req.url) return _jsonResponse({ ok: false, error: 'Missing url', code: 'BAD_REQUEST' });

    var result;
    try {
      result = refreshArticle({
        url: req.url, mode: req.mode || 'update',
        reviewer: req.reviewer || AUTO_REVIEWER, publishDate: '', oldUrl: req.oldUrl || '',
      });
    } catch (rfErr) {
      var parsed;
      try { parsed = JSON.parse(rfErr.message); } catch (_) { parsed = null; }
      if (parsed && parsed.code) {
        return _jsonResponse({
          ok: false, code: parsed.code, error: parsed.message || rfErr.message,
          existingDocTitle: parsed.existingDocTitle || '',
          existingDocUrl:   parsed.existingDocUrl   || '',
          matchedBy:        parsed.matchedBy        || '',
        });
      }
      return _jsonResponse({ ok: false, code: 'REFRESH_ERROR', error: rfErr.message });
    }

    return _jsonResponse({
      ok: true, mode: result.mode, docUrl: result.docUrl,
      docTitle: result.docTitle, docFilename: result.docFilename,
      matchedBy: result.matchedBy || '', issues: result.issues || [],
    });

  } catch (err) {
    Logger.log('doPost INTERNAL ERROR: ' + err + '\n' + (err.stack || ''));
    return _jsonResponse({ ok: false, error: 'Internal error: ' + err.message, code: 'INTERNAL' });
  }
}

function _jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ============================================================
// MODE: UPDATE
// ============================================================

function updateDoc(normalizedUrl, slug, oldUrl, title, publishDate,
                   reviewer, lastModifiedStr, blocks, originalUrl) {
  var file      = null;
  var matchedBy = '';

  var cacheUrl    = originalUrl || normalizedUrl;
  var cachedId    = _getCachedFileId(cacheUrl);
  if (cachedId) {
    file = _openCachedDocFile(cachedId);
    if (file) matchedBy = 'cache';
    else Logger.log('Cached fileId stale for ' + slug + ' — will rescan.');
  }

  if (!file) {
    var searchUrl = (oldUrl && normalizeUrl(oldUrl)) ? normalizeUrl(oldUrl) : normalizedUrl;
    var match     = findDocBySlugOrUrl(slug, searchUrl);

    if (!match.file) {
      var hint = oldUrl
        ? 'No Doc found matching old URL "' + searchUrl + '" or slug "' + slug + '".'
        : 'If this is a new article use mode "create". If the slug changed, pass oldUrl.';
      throw new Error(JSON.stringify({
        code: 'DOC_NOT_FOUND',
        message: 'No Doc matches slug "' + slug + '" or URL "' + searchUrl + '". ' + hint,
      }));
    }
    file      = match.file;
    matchedBy = match.matchedBy;
  }

  var fileId = file.getId();

  if (matchedBy !== 'cache') {
    _setCachedFileId(cacheUrl, fileId);
  }

  var previousRefresh    = readCurrentRefreshLine(fileId) || '—';
  var currentRefreshLine = publishDate + (reviewer ? ' — ' + reviewer : '');

  var headerLines = [
    'Published link: '          + normalizedUrl,
    'Slug: '                    + slug,
    'Current refresh: '         + currentRefreshLine,
    'Previous refresh: '        + previousRefresh,
    'Last modified in source: ' + lastModifiedStr,
  ];

  var doc = DocumentApp.openById(fileId);
  writeDocHeader(doc, headerLines);
  writeDocBody(doc, blocks);
  doc.saveAndClose();

  try {
    var desiredName = _renamedFilenameForTitle_(file.getName(), title);
    if (desiredName) {
      Logger.log('Renaming doc: "' + file.getName() + '" -> "' + desiredName + '"');
      file.setName(desiredName);
    }
  } catch (renameErr) {
    Logger.log('Rename skipped for ' + slug + ': ' + (renameErr.message || renameErr));
  }

  nameCurrentVersion(fileId, title + ' — ' + publishDate + (reviewer ? ' (' + reviewer + ')' : ''));

  var auditLine = '[' + Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd HH:mm') + ' UTC]' +
    ' Updated by ' + (reviewer || 'unknown') + ' | ' + title + ' | ' + publishDate;
  updateDescriptionLog(file, auditLine);

  return {
    status: 'ok', mode: 'update',
    docUrl: 'https://docs.google.com/document/d/' + fileId + '/edit',
    docTitle: title, docFilename: file.getName(),
    matchedBy: matchedBy, issues: [],
  };
}

function _renamedFilenameForTitle_(currentName, newTitle) {
  var parts = (currentName || '').split(' - ');
  if (parts.length < 4) return null;
  var suffix   = parts.slice(parts.length - 3);
  var oldTitle = parts.slice(0, parts.length - 3).join(' - ');
  var cleanNew = sanitizeFilename(newTitle || '');
  if (!cleanNew) return null;
  if (sanitizeFilename(oldTitle) === cleanNew) return null;
  return sanitizeFilename(cleanNew + ' - ' + suffix.join(' - '));
}


// ============================================================
// MODE: CREATE
// ============================================================

function createDoc(normalizedUrl, slug, title, publishDate, reviewer,
                   lastModifiedStr, blocks, fields, article) {
  var existing = findDocBySlugOrUrl(slug, normalizedUrl);
  if (existing.file) {
    throw new Error(JSON.stringify({
      code: 'ALREADY_EXISTS',
      message: 'A Doc already exists: "' + existing.file.getName() +
               '" (matched by ' + existing.matchedBy + '). Use update mode.',
      existingDocUrl: 'https://docs.google.com/document/d/' + existing.file.getId() + '/edit',
      existingDocTitle: existing.file.getName(),
      matchedBy: existing.matchedBy,
    }));
  }

  var issues = [];
  if (title === 'Untitled') issues.push('Missing title — Doc named "Untitled"');

  var audience = mapAudience(fields.audience);
  var language = detectLanguage(article.item);
  if (audience === 'general') issues.push('Audience not detected; defaulted to "general"');

  var filename           = buildFilename(title, 'external', audience, language);
  var currentRefreshLine = publishDate + (reviewer ? ' — ' + reviewer : '');

  var headerLines = [
    'Published link: '          + normalizedUrl,
    'Slug: '                    + slug,
    'Current refresh: '         + currentRefreshLine,
    'Previous refresh: —',
    'Last modified in source: ' + lastModifiedStr,
  ];

  var folder    = DriveApp.getFolderById(FOLDER_ID);
  var newFile   = DocumentApp.create(filename);
  var newFileId = newFile.getId();
  var driveFile = DriveApp.getFileById(newFileId);
  folder.addFile(driveFile);
  DriveApp.getRootFolder().removeFile(driveFile);

  writeDocHeader(newFile, headerLines);
  writeDocBody(newFile, blocks);
  newFile.saveAndClose();

  _DOC_INDEX = null;

  _setCachedFileId(normalizedUrl, newFileId);

  nameCurrentVersion(newFileId,
    title + ' — ' + publishDate + (reviewer ? ' (' + reviewer + ')' : '') + ' (created)');

  var auditLine = '[' + Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd HH:mm') + ' UTC]' +
    ' Created by ' + (reviewer || 'unknown') + ' | ' + title + ' | ' + publishDate;
  updateDescriptionLog(driveFile, auditLine);

  return {
    status: 'ok', mode: 'create',
    docUrl: 'https://docs.google.com/document/d/' + newFileId + '/edit',
    docTitle: title, docFilename: filename, issues: issues,
  };
}


// ============================================================
// DOC WRITING — HEADER
// ============================================================

function writeDocHeader(doc, lines) {
  var header   = doc.getHeader() || doc.addHeader();
  var oldCount = header.getNumChildren();

  lines.forEach(function(line) {
    var para = header.appendParagraph(line);
    para.setHeading(DocumentApp.ParagraphHeading.NORMAL);
    para.setSpacingBefore(0);
    para.setSpacingAfter(0);
    styleHeader(para);
  });

  for (var i = oldCount - 1; i >= 0; i--) {
    var child = header.getChild(i);
    if (header.getNumChildren() <= 1) {
      try { child.asParagraph().setText(''); } catch (e) {}
      break;
    }
    try {
      child.removeFromParent();
    } catch (e) {
      try { child.asParagraph().setText(''); } catch (e2) {}
    }
  }
}

function styleHeader(para) {
  var text = para.editAsText();
  text.setFontFamily('Montserrat');
  text.setFontSize(9);
  text.setForegroundColor('#999999');
}


// ============================================================
// DOC WRITING — BODY
// ============================================================

function writeDocBody(doc, blocks) {
  var body     = doc.getBody();
  var oldCount = body.getNumChildren();
  var addedAny = false;

  blocks.forEach(function(b) {
    if (appendBlockToBody_(body, b)) addedAny = true;
  });

  if (!addedAny) body.appendParagraph('');

  var last = body.getChild(body.getNumChildren() - 1);
  if (last.getType() !== DocumentApp.ElementType.PARAGRAPH) body.appendParagraph('');

  for (var i = oldCount - 1; i >= 0; i--) {
    var child = body.getChild(i);
    if (body.getNumChildren() <= 1) {
      try { child.asParagraph().setText(''); } catch (e) {}
      break;
    }
    try {
      child.removeFromParent();
    } catch (e) {
      try { child.asParagraph().setText(''); } catch (e2) {}
    }
  }
}

function appendBlockToBody_(body, b) {
  var type = b.type;
  var text = b.text || '';

  if (type === 'h1') {
    var p1 = body.appendParagraph(text);
    p1.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    styleHeading(p1, 14, '#1c4587', 10, 4, true);
    return true;
  }
  if (type === 'h2' || type === 'h1_extra') {
    var p2 = body.appendParagraph(text);
    p2.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    styleHeading(p2, 13, '#3c78d8', 8, 3, false);
    return true;
  }
  if (type === 'h3') {
    var p3 = body.appendParagraph(text);
    p3.setHeading(DocumentApp.ParagraphHeading.HEADING3);
    styleHeading(p3, 12, '#6fa8dc', 6, 3, false);
    return true;
  }
  if (type === 'list_item' || type === 'numbered_item') {
    var item = body.appendListItem(text);
    item.setHeading(DocumentApp.ParagraphHeading.NORMAL);
    item.setGlyphType(type === 'list_item' ? DocumentApp.GlyphType.BULLET : DocumentApp.GlyphType.NUMBER);
    styleListItem(item);
    if (b.runs && b.runs.length) applyRunMarks(item, b.runs);
    return true;
  }
  if (type === 'image') {
    var pi = body.appendParagraph('[Image: ' + text + ']');
    pi.setSpacingBefore(6);
    pi.setSpacingAfter(6);
    var it = pi.editAsText();
    it.setFontFamily('Montserrat');
    it.setFontSize(10);
    it.setForegroundColor('#000000');
    it.setBold(false);
    it.setItalic(true);
    return true;
  }
  if (type === 'table') {
    appendTableBlock_(body, b);
    return true;
  }
  if (type === 'spacer') return false;

  var displayText = (b.runs && b.runs.length) ? runsToText(b.runs) : text;
  if (!displayText) return false;
  var para = body.appendParagraph(displayText);
  para.setHeading(DocumentApp.ParagraphHeading.NORMAL);
  styleBody(para);
  if (b.runs && b.runs.length) applyRunMarks(para, b.runs);
  return true;
}

function appendTableBlock_(body, b) {
  var rows = b.rows || [];
  if (!rows.length) return;
  var table = body.appendTable(rows);
  table.setBorderColor('#cccccc');
  for (var r = 0; r < table.getNumRows(); r++) {
    var row = table.getRow(r);
    for (var c = 0; c < row.getNumCells(); c++) {
      var cell = row.getCell(c);
      cell.setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(6).setPaddingRight(6);
      try {
        var tx = cell.editAsText();
        if (tx.getText().length) {
          tx.setFontFamily('Montserrat');
          tx.setFontSize(10);
          tx.setForegroundColor('#000000');
          tx.setBold(r === 0);
        }
      } catch (e) { /* empty cell */ }
    }
  }
  body.appendParagraph('');
}


function styleHeading(para, sizePt, hexColor, spacingBefore, spacingAfter, bold) {
  para.setSpacingBefore(spacingBefore);
  para.setSpacingAfter(spacingAfter);
  var text = para.editAsText();
  text.setFontFamily('Montserrat');
  text.setFontSize(sizePt);
  text.setForegroundColor(hexColor);
  text.setBold(bold);
  text.setItalic(false);
}

function styleBody(para) {
  para.setSpacingBefore(0);
  para.setSpacingAfter(6);
  var text = para.editAsText();
  text.setFontFamily('Montserrat');
  text.setFontSize(10);
  text.setForegroundColor('#000000');
  text.setBold(false);
  text.setItalic(false);
}

function styleListItem(item) {
  item.setSpacingBefore(0);
  item.setSpacingAfter(2);
  var text = item.editAsText();
  text.setFontFamily('Montserrat');
  text.setFontSize(10);
  text.setForegroundColor('#000000');
  text.setBold(false);
}

function applyRunMarks(el, runs) {
  var editText = el.editAsText();
  var total = editText.getText().length;
  if (!total) return;
  var pos = 0;
  runs.forEach(function(r) {
    var t = r.text || '';
    if (!t) return;
    var end = Math.min(pos + t.length - 1, total - 1);
    if (pos < total && end >= pos) {
      try {
        if (r.bold)   editText.setBold(pos, end, true);
        if (r.italic) editText.setItalic(pos, end, true);
        if (r.link) {
          editText.setLinkUrl(pos, end, r.link);
          editText.setForegroundColor(pos, end, '#1155cc');
          editText.setUnderline(pos, end, true);
        }
      } catch (e) { /* skip bad indices */ }
    }
    pos += t.length;
  });
}



// ============================================================
// DOC FINDING  (cached per-execution index)
// ============================================================

function _getDocIndex() {
  if (_DOC_INDEX) return _DOC_INDEX;

  var index = { bySlug: {}, byUrl: {}, files: {} };
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var files  = folder.getFilesByType(MimeType.GOOGLE_DOCS);

  while (files.hasNext()) {
    var file = files.next();
    try {
      var info = readHeaderInfo(file);
      var id   = file.getId();
      index.files[id] = file;
      if (info.slug) {
        var s = info.slug.trim().toLowerCase();
        if (s && !index.bySlug[s]) index.bySlug[s] = id;
      }
      if (info.publishedLink) {
        var u = normalizeUrl(info.publishedLink);
        if (u && !index.byUrl[u]) index.byUrl[u] = id;
      }
    } catch (e) {}
  }

  _DOC_INDEX = index;
  Logger.log('Doc index built: ' + Object.keys(index.files).length + ' docs.');
  return index;
}

function findDocBySlugOrUrl(targetSlug, targetUrl) {
  var index    = _getDocIndex();
  var normSlug = (targetSlug || '').trim().toLowerCase();
  var normUrl  = normalizeUrl(targetUrl);

  if (normSlug && index.bySlug[normSlug]) {
    return { file: index.files[index.bySlug[normSlug]], matchedBy: 'slug' };
  }
  if (normUrl && index.byUrl[normUrl]) {
    return { file: index.files[index.byUrl[normUrl]], matchedBy: 'url' };
  }
  return { file: null };
}

function readHeaderInfo(file) {
  var doc  = DocumentApp.openById(file.getId());
  var info = { slug: '', publishedLink: '' };

  function scanContainer(container, maxLines) {
    if (!container) return;
    var n = container.getNumChildren();
    for (var i = 0; i < Math.min(n, maxLines); i++) {
      var child = container.getChild(i);
      if (child.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;
      var line  = child.asParagraph().getText().trim();
      var lower = line.toLowerCase();
      if (!info.publishedLink && lower.indexOf('published link:') === 0) {
        info.publishedLink = line.substring('published link:'.length).trim();
      }
      if (!info.slug && lower.indexOf('slug:') === 0) {
        info.slug = line.substring('slug:'.length).trim();
      }
    }
  }

  scanContainer(doc.getHeader(), 8);
  if (!info.publishedLink && !info.slug) scanContainer(doc.getBody(), 8);
  return info;
}

function readCurrentRefreshLine(fileId) {
  var doc    = DocumentApp.openById(fileId);
  var header = doc.getHeader();
  if (!header) return null;
  var n = header.getNumChildren();
  for (var i = 0; i < Math.min(n, 8); i++) {
    var child = header.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
      var line = child.asParagraph().getText().trim();
      if (line.toLowerCase().startsWith('current refresh:')) {
        return line.substring('current refresh:'.length).trim() || null;
      }
    }
  }
  return null;
}


// ============================================================
// MOVED / RETIRED ARTICLES
// ============================================================

/**
 * Asks the live Help Center where an old URL goes. Returns the new slug if the
 * page redirects to a different /article/<slug>, otherwise ''.
 */
function _findRedirectSlug_(slug) {
  var url = HC_ARTICLE_BASE + slug;
  for (var hop = 0; hop < 5; hop++) {
    var res  = UrlFetchApp.fetch(url, { followRedirects: false, muteHttpExceptions: true });
    var code = res.getResponseCode();
    if (code < 300 || code >= 400) break;
    var headers = res.getAllHeaders();
    var loc = headers['Location'] || headers['location'] || '';
    if (!loc) break;
    if (loc.indexOf('/') === 0) loc = 'https://help.thumbtack.com' + loc;
    url = loc;
  }
  var newSlug = extractSlugFromUrl(url);
  return (newSlug && newSlug.toLowerCase() !== slug.toLowerCase()) ? newSlug : '';
}

/**
 * Called when a slug is not in Contentful.
 *  moved   -> HC redirects to a slug that IS in Contentful: refresh the existing
 *             Doc (found by cached fileId or old slug) under the new URL.
 *  retired -> no redirect: flag for review, never touch the Doc.
 */
function _handleMissingSlug_(oldUrl, oldSlug) {
  try {
    var newSlug = _findRedirectSlug_(oldSlug);
    if (!newSlug) return { status: 'retired' };

    var article = fetchArticleFromContentful(newSlug);
    if (!article) return { status: 'retired' };

    var newUrl  = HC_ARTICLE_BASE + newSlug;
    var blocks  = parseArticleToBlocks(article);
    var fields  = article.item.fields || {};
    var result  = updateDoc(normalizeUrl(newUrl), newSlug, oldUrl, fields.title || 'Untitled',
                            getTodayDateInternal(), AUTO_REVIEWER,
                            formatDateLong(article.latestContentUpdate), blocks, oldUrl);
    Logger.log('[MOVED] ' + oldSlug + ' -> ' + newSlug);
    return {
      status: 'moved', newSlug: newSlug, newUrl: newUrl, docUrl: result.docUrl,
      hash: _computeContentHash(blocks), updatedAt: article.latestContentUpdate,
    };
  } catch (e) {
    var msg = e.message || String(e);
    try { msg = JSON.parse(msg).message || msg; } catch (_) {}
    return { status: 'error', error: 'missing slug check: ' + msg };
  }
}

/**
 * Manual check from the editor. Edit the list and press Run.
 * Only READS — does not change the sheet or any Doc.
 */
function checkFailedSlugs() {
  var slugs = ['personalized-preferences', 'midea-recall-program', 'direct-calls'];
  slugs.forEach(function(s) {
    var inCf = !!fetchArticleFromContentful(s);
    if (inCf) { Logger.log(s + ' -> IS in Contentful now (will sync normally)'); return; }
    var ns = _findRedirectSlug_(s);
    if (!ns) { Logger.log(s + ' -> RETIRED: no redirect (unpublished or deleted)'); return; }
    var nsInCf = !!fetchArticleFromContentful(ns);
    Logger.log(s + ' -> MOVED to ' + ns + (nsInCf ? ' (found in Contentful, auto-fix will work)'
                                                   : ' (new slug NOT in Contentful either)'));
  });
}


// ============================================================
// CONTENTFUL FETCH
// ============================================================

function fetchArticleFromContentful(slug) {
  var params = { content_type: 'helpCenterArticle', 'fields.slug': slug, include: 10 };
  var qs = Object.keys(params).map(function(k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');

  var response = UrlFetchApp.fetch(CONTENTFUL_BASE + '/entries?' + qs, {
    headers:            { 'Authorization': 'Bearer ' + CONTENTFUL_TOKEN },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('Contentful API error ' + response.getResponseCode() + ': ' +
      response.getContentText().slice(0, 200));
  }

  var data = JSON.parse(response.getContentText());
  if (!data.items || data.items.length === 0) return null;
  return _articleFromCfData(data);
}


// ============================================================
// RICH TEXT → BLOCKS
// ============================================================

function parseArticleToBlocks(article) {
  var blocks   = [];
  var fields   = (article.item.fields) || {};
  var includes = article.includes;
  includes.articleSlug = fields.slug || '';

  if (fields.title) blocks.push({ type: 'h1', text: fields.title });

  var body = fields.bodyText;
  if (body && body.content) walkRichTextNodes(body.content, blocks, includes);

  var deduped = [];
  blocks.forEach(function(b) {
    if (deduped.length > 0 &&
        ['list_item', 'numbered_item', 'spacer', 'table'].indexOf(b.type) === -1 &&
        deduped[deduped.length - 1].type === b.type &&
        deduped[deduped.length - 1].text === b.text) return;
    deduped.push(b);
  });
  return deduped;
}

function walkRichTextNodes(nodes, blocks, includes) {
  if (!Array.isArray(nodes)) return;
  nodes.forEach(function(node) {
    if (!node) return;
    var ntype = node.nodeType;

    if (ntype === 'heading-1') {
      var t1 = extractText(node.content);
      if (t1) blocks.push({ type: 'h1_extra', text: t1 });

    } else if (ntype === 'heading-2') {
      var t2 = extractText(node.content);
      if (t2) blocks.push({ type: 'h2', text: t2 });

    } else if (ntype === 'heading-3' || ntype === 'heading-4' ||
               ntype === 'heading-5' || ntype === 'heading-6') {
      var t3 = extractText(node.content);
      if (t3) blocks.push({ type: 'h3', text: t3 });

    } else if (ntype === 'paragraph') {
      var runs = normalizeRuns(extractRichRuns(node.content, includes));
      var text = runsToText(runs);
      if (!text) return;
      var keepBold = isAllBold(runs) && text.length < 80;
      if (!keepBold) runs.forEach(function(r) { r.bold = false; });
      blocks.push({ type: 'paragraph', text: text, runs: runs });

    } else if (ntype === 'unordered-list' || ntype === 'ordered-list') {
      var itemType = ntype === 'ordered-list' ? 'numbered_item' : 'list_item';
      var first = true;
      (node.content || []).forEach(function(li) {
        if (!li || li.nodeType !== 'list-item') return;
        var lr = normalizeRuns(extractListItemRuns(li.content, includes));
        var lt = runsToText(lr);
        if (lt) {
          blocks.push({ type: itemType, text: lt, runs: lr, restart: first });
          first = false;
        }
      });

    } else if (ntype === 'embedded-asset-block') {
      var assetId = ((node.data || {}).target || {}).sys ? node.data.target.sys.id : null;
      var asset   = assetId ? includes.assets[assetId] : null;
      var alt     = 'decorative';
      if (asset && asset.fields) {
        alt = asset.fields.title || asset.fields.description || 'decorative';
      }
      blocks.push(isSpacerImage(alt, asset) ? { type: 'spacer' } : { type: 'image', text: alt });

    } else if (ntype === 'embedded-entry-block' || ntype === 'embedded-entry-inline') {
      var entryId = ((node.data || {}).target || {}).sys ? node.data.target.sys.id : null;
      var entry   = entryId ? includes.entries[entryId] : null;
      if (entry) renderEmbeddedEntry(entry, blocks, includes);

    } else if (ntype === 'hr') {
      // skip

    } else if (ntype === 'blockquote') {
      var tq = extractText(node.content);
      if (tq) blocks.push({ type: 'paragraph', text: 'Quote: ' + tq,
        runs: [{ text: 'Quote: ' + tq, bold: false, italic: false, link: '' }] });

    } else if (node.content) {
      var to = extractText(node.content);
      if (to) blocks.push({ type: 'paragraph', text: to,
        runs: [{ text: to, bold: false, italic: false, link: '' }] });
    }
  });
}

function plainBlock_(text) {
  return { type: 'paragraph', text: text, runs: [{ text: text, bold: false, italic: false, link: '' }] };
}

function renderEmbeddedEntry(entry, blocks, includes) {
  var contentType = ((entry.sys || {}).contentType || {}).sys ? entry.sys.contentType.sys.id : null;
  var fields = entry.fields || {};

  if (contentType === 'segment') {
    if (fields.title) {
      var segType = fields.type || '';
      blocks.push((segType === 'Collapse' || segType === 'Toggle')
        ? { type: 'h3', text: fields.title }
        : { type: 'h2', text: fields.title });
    }
    if (fields.content && fields.content.content) {
      walkRichTextNodes(fields.content.content, blocks, includes);
    }

  } else if (contentType === 'contentToggle') {
    (fields.toggleSegments || []).forEach(function(seg) {
      var segEntry = includes.entries[(seg.sys || {}).id];
      if (segEntry) renderEmbeddedEntry(segEntry, blocks, includes);
    });

  } else if (contentType === 'proTip') {
    blocks.push({ type: 'h3', text: fields.title || 'Pro tip' });
    if (fields.content && fields.content.content) {
      walkRichTextNodes(fields.content.content, blocks, includes);
    }

  } else if (contentType === 'iFrame') {
    blocks.push(plainBlock_('[Interactive: ' + (fields.title || 'Interactive content') +
      (fields.src ? ' — ' + fields.src : '') + ']'));

  } else if (contentType === 'video') {
    blocks.push(plainBlock_('[Video: ' + (fields.title || fields.name || 'Video') +
      (fields.duration ? ' (' + fields.duration + ')' : '') + ']'));

  } else if (contentType === 'articleCTA') {
    if (fields.prompt) blocks.push(plainBlock_(fields.prompt));
    if (fields.actionLabel) blocks.push(plainBlock_('[Button: ' + fields.actionLabel + ']'));

  } else if (contentType === 'megaCta') {
    if (fields.title) blocks.push({ type: 'h3', text: fields.title });
    if (fields.prompt) blocks.push(plainBlock_(fields.prompt));
    if (fields.actionLabel) blocks.push(plainBlock_('[Button: ' + fields.actionLabel + ']'));

  } else if (contentType === 'uiCard') {
    var cardName = fields.entryName || fields.name || '';
    if (cardName) blocks.push(plainBlock_('[Card: ' + cardName + (fields.action ? ' — ' + fields.action : '') + ']'));

  } else if (contentType === 'helpCenterArticle') {
    var refTitle = fields.title || fields.name || '';
    if (refTitle) blocks.push(plainBlock_('[Related article: ' + refTitle + (fields.slug ? ' (/' + fields.slug + ')' : '') + ']'));

  } else if (contentType === 'directLink') {
    var linkTitle = fields.title || fields.name || '';
    if (linkTitle) blocks.push(plainBlock_('[Link: ' + linkTitle + (fields.url ? ' — ' + fields.url : '') + ']'));

  } else if (contentType === 'table') {
    var tdata = (fields.table || {}).tableData;
    if (Array.isArray(tdata) && tdata.length) {
      var width = 0;
      tdata.forEach(function(r) { if (r && r.length > width) width = r.length; });
      var rows = tdata.map(function(r) {
        var out = [];
        for (var c = 0; c < width; c++) {
          out.push(String((r && r[c]) || '').replace(/\s+/g, ' ').trim());
        }
        return out;
      });
      blocks.push({ type: 'table', text: fields.name || '', rows: rows });
    } else if (fields.content && fields.content.content) {
      walkRichTextNodes(fields.content.content, blocks, includes);
    }

  } else {
    if (fields.title) blocks.push(plainBlock_(fields.title));
    var bodyField = fields.content || fields.body;
    if (bodyField && bodyField.content) {
      walkRichTextNodes(bodyField.content, blocks, includes);
    }
  }
}



// ============================================================
// RICH TEXT HELPERS
// ============================================================

function extractText(content) {
  if (!Array.isArray(content)) return '';
  var parts = [];
  content.forEach(function(node) {
    if (!node) return;
    if (node.nodeType === 'text') {
      parts.push(node.value || '');
    } else if (node.content) {
      parts.push(extractText(node.content));
    }
  });
  return cleanText(parts.join(''));
}

function extractRichRuns(content, includes, linkUrl) {
  if (!Array.isArray(content)) return [];
  var runs = [];
  content.forEach(function(node) {
    if (!node) return;
    var nt = node.nodeType;
    if (nt === 'text') {
      var marks = node.marks || [];
      runs.push({
        text:   node.value || '',
        bold:   marks.some(function(m) { return m.type === 'bold'; }),
        italic: marks.some(function(m) { return m.type === 'italic'; }),
        link:   linkUrl || '',
      });
    } else if (nt === 'hyperlink') {
      runs = runs.concat(extractRichRuns(node.content, includes, (node.data || {}).uri || ''));
    } else if (nt === 'entry-hyperlink') {
      runs = runs.concat(extractRichRuns(node.content, includes, resolveEntryLink_(node, includes)));
    } else if (nt === 'asset-hyperlink') {
      runs = runs.concat(extractRichRuns(node.content, includes, resolveAssetLink_(node, includes)));
    } else if (node.content) {
      runs = runs.concat(extractRichRuns(node.content, includes, linkUrl));
    }
  });
  return runs;
}

function resolveEntryLink_(node, includes) {
  try {
    var id = node.data.target.sys.id;
    var e  = includes && includes.entries ? includes.entries[id] : null;
    if (e && e.fields && e.fields.slug) return HC_ARTICLE_BASE + e.fields.slug;
    if (includes && includes.articleSlug) return HC_ARTICLE_BASE + includes.articleSlug;
  } catch (err) {}
  return '';
}

function resolveAssetLink_(node, includes) {
  try {
    var a = includes.assets[node.data.target.sys.id];
    var u = a && a.fields && a.fields.file ? a.fields.file.url : '';
    if (u && u.indexOf('//') === 0) u = 'https:' + u;
    return u || '';
  } catch (err) { return ''; }
}

function extractListItemRuns(content, includes) {
  var runs = [];
  (content || []).forEach(function(node) {
    if (!node) return;
    var part = extractRichRuns(node.nodeType === 'paragraph' ? node.content : [node], includes);
    if (runs.length && part.length) runs.push({ text: ' ', bold: false, italic: false, link: '' });
    runs = runs.concat(part);
  });
  return runs;
}

// Cleans whitespace PER RUN so the written text and the bold/link
// positions always line up.
function normalizeRuns(runs) {
  var out = [];
  (runs || []).forEach(function(r) {
    var t = (r.text || '').replace(/\s+/g, ' ');
    if (!t) return;
    var prev = out[out.length - 1];
    if (prev && /\s$/.test(prev.text)) t = t.replace(/^\s+/, '');
    if (!out.length) t = t.replace(/^\s+/, '').replace(/^#+\s*/, '');
    if (!t) return;
    out.push({ text: t, bold: !!r.bold, italic: !!r.italic, link: r.link || '' });
  });
  while (out.length) {
    var last = out[out.length - 1];
    last.text = last.text.replace(/\s+$/, '');
    if (last.text) break;
    out.pop();
  }
  return out;
}

function runsToText(runs) {
  return (runs || []).map(function(r) { return r.text || ''; }).join('');
}

function isAllBold(runs) {
  if (!runs || runs.length === 0) return false;
  var hasAny = false;
  for (var i = 0; i < runs.length; i++) {
    var t = runs[i].text || '';
    if (t.trim()) {
      hasAny = true;
      if (!runs[i].bold) return false;
    }
  }
  return hasAny;
}

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').replace(/^#+\s*/, '').trim();
}


function isSpacerImage(alt, asset) {
  if (!alt) return false;
  var lower = alt.toLowerCase();
  if (/padding|spacer|space|divider|separator|gap/.test(lower)) return true;
  if (/\d+\s*(px|pixel|pixeles)/.test(lower)) return true;
  if (asset && asset.fields) {
    var details = ((asset.fields.file || {}).details || {}).image;
    if (details && (details.width <= 10 || details.height <= 10)) return true;
  }
  return false;
}


// ============================================================
// METADATA HELPERS
// ============================================================

function mapAudience(audienceArr) {
  if (!audienceArr || audienceArr.length === 0) return 'general';
  var hasPro = false, hasCustomer = false;
  audienceArr.forEach(function(a) {
    var lower = (a || '').toLowerCase();
    if (/pro|profesional|professional/.test(lower)) hasPro = true;
    if (/customer|cliente|homeowner/.test(lower))   hasCustomer = true;
  });
  if (hasPro && hasCustomer) return 'pro and customer';
  if (hasPro)      return 'pro';
  if (hasCustomer) return 'customer';
  return 'general';
}

function detectLanguage(item) {
  var fields     = item.fields || {};
  var title      = fields.title || '';
  var bodySample = extractBodySample(fields.bodyText || {}, 5000);
  var sample     = (title + ' ' + bodySample).toLowerCase();

  var ptHits = (sample.match(/ção|ões|não|você|obrigad|verificação|publicação|preferências|configurações|inscriç/g) || []).length;
  var esHits = (sample.match(/¿|¡|ñ|cómo|qué|verificación|información|configuración|preferencias|antecedentes|profesional|registrar|iniciar sesión|cuenta|usted|así/g) || []).length;

  if (ptHits >= 3 && ptHits > esHits) return 'PT';
  if (esHits >= 3) return 'ES';

  var name = fields.name || '';
  if (/\[Spanish\]|\[Español\]/i.test(name))  return 'ES';
  if (/\[Portuguese\]/i.test(name))            return 'PT';
  return 'EN';
}

function extractBodySample(bodyField, maxChars) {
  if (!bodyField || !bodyField.content) return '';
  var parts = [], total = 0;
  function walk(nodes) {
    if (!Array.isArray(nodes)) return;
    nodes.forEach(function(n) {
      if (total >= maxChars || !n) return;
      if (n.nodeType === 'text') {
        parts.push(n.value || '');
        total += (n.value || '').length;
      } else if (n.content) {
        walk(n.content);
      }
    });
  }
  walk(bodyField.content);
  return parts.join(' ');
}

function buildFilename(title, lane, audience, language) {
  return sanitizeFilename(title + ' - ' + lane + ' - ' + audience + ' - ' + language);
}

function normalizeUrl(url) {
  if (!url) return '';
  var s        = url.trim();
  var hashIdx  = s.indexOf('#');
  if (hashIdx  !== -1) s = s.substring(0, hashIdx);
  var queryIdx = s.indexOf('?');
  if (queryIdx !== -1) s = s.substring(0, queryIdx);
  return s.replace(/\/+$/, '').toLowerCase();
}

function sanitizeFilename(name) {
  return (name || '').replace(/[<>:"/\\|?*\r\n]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

function extractSlugFromUrl(url) {
  var m = (url || '').match(/\/article\/([^/?#]+)/);
  return m ? m[1] : null;
}


// ============================================================
// DATE HELPERS
// ============================================================

function getTodayDateInternal() {
  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  var d = new Date();
  return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
}

function formatDateLong(isoStr) {
  if (!isoStr) return 'Unknown';
  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  try {
    var d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    var h    = d.getUTCHours();
    var min  = String(d.getUTCMinutes()).padStart(2, '0');
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' +
           d.getUTCFullYear() + ' at ' + h + ':' + min + ' ' + ampm;
  } catch (e) { return isoStr; }
}


// ============================================================
// AUDIT + VERSION
// ============================================================

function updateDescriptionLog(file, newLine) {
  var existing = file.getDescription() || '';
  var updated  = newLine + '\n' + existing;
  if (updated.length > MAX_DESCRIPTION_CHARS) updated = updated.slice(0, MAX_DESCRIPTION_CHARS);
  file.setDescription(updated);
}

function nameCurrentVersion(fileId, versionName) {
  try {
    var list = Drive.Revisions.list(fileId, { fields: 'revisions(id)' });
    var revs = list.revisions || [];
    if (revs.length === 0) return;
    var latestId = revs[revs.length - 1].id;
    Drive.Revisions.update({ keepRevisionForever: true }, fileId, latestId);
  } catch (e) {
    Logger.log('nameCurrentVersion warning: ' + e.message);
  }
}


// ============================================================
// TRIGGER SETUP — run once from the editor
// ============================================================

function installNightlyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'runNightlySync') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runNightlySync').timeBased().everyDays(1).atHour(2).create();
  Logger.log('Nightly trigger installed: runNightlySync at 2 AM UTC.');
  _ensureTickTrigger();
}

function installTickTrigger() {
  _ensureTickTrigger();
  Logger.log('Tick trigger ensured (every ' + TICK_INTERVAL_MIN + ' min).');
}

function emergencyStop() {
  var deleted = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); deleted++; });
  PropertiesService.getScriptProperties().deleteAllProperties();
  Logger.log('Emergency stop: ' + deleted + ' trigger(s) deleted, state cleared.');
  Logger.log('To restart the system, run installNightlyTrigger().');
}

function testSingleArticle() {
  var testUrl = 'https://help.thumbtack.com/article/thumbtack-phone-numbers-on-direct-leads';
  Logger.log('Testing: ' + testUrl);
  Logger.log('Result: ' + JSON.stringify(syncSingleArticle(testUrl)));
}

function debugState() {
  var props    = PropertiesService.getScriptProperties().getProperties();
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log('=== AS_ PROPERTIES ===');
  Logger.log(JSON.stringify(props, null, 2));
  Logger.log('=== TRIGGERS (' + triggers.length + ') ===');
  triggers.forEach(function(t) {
    Logger.log(t.getHandlerFunction() + ' | ' + t.getEventType() + ' | id:' + t.getUniqueId());
  });
}

function labelHashColumn() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_TAB_ARTICLES);
  if (sheet) sheet.getRange(1, 5).setValue('Content hash');
  Logger.log('Column E labeled.');
}