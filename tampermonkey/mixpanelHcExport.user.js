// ==UserScript==
// @name         Mixpanel HC Export - Content Index
// @namespace    https://thumbtack.com/
// @version      2.0.1
// @updateURL    https://raw.githubusercontent.com/jorgecTT/content-index-tools/main/tampermonkey/mixpanelHcExport.user.js
// @downloadURL  https://raw.githubusercontent.com/jorgecTT/content-index-tools/main/tampermonkey/mixpanelHcExport.user.js
// @description  One click on a Mixpanel Insights report broken down by Page URL: exports one CSV with Help Center views per article for the last 30, 60 and 90 days and this year, URLs cleaned and grouped per article.
// @author       jcardona@thumbtack.com
// @match        https://mixpanel.com/project/*
// @noframes
// @grant        none
// @run-at       document-start
// ==/UserScript==

/*
 * MIXPANEL HC EXPORT v2.0.0
 *
 * How it works:
 *   - Mixpanel's page loads each report from /api/query/insights. The script
 *     keeps a copy of that request (same login, same report) as a template.
 *   - Mixpanel only sends 3,000 rows per query, and Help Center URLs have
 *     thousands of variants (?_c=..., ?utm_..., #anchors). So the script asks
 *     for the report in short date ranges (7 days; if a range is still cut
 *     off, it splits it in half again, down to 1 day), cleans every URL,
 *     groups by article slug and adds everything up.
 *   - One CSV with columns per window: last 30, 60, 90 days and this year.
 *   - Only /article/ pages are kept (search and topic pages are left out),
 *     and help.thumbtack.com + thumbtack.my.site.com count as one article.
 *   - Unique viewers can't be added across URL variants or date ranges, so
 *     they are not in the CSV. Any other metric (views, helpful Yes/No) is.
 *   - Finished date ranges are saved in this browser, so the next export
 *     only asks Mixpanel for the new days.
 *
 * One-time setup: the report must use a Custom date range (any dates) and be
 * saved, so the script can find where the dates go in the request.
 *
 * v1.0.0 - CSV of the report on screen.
 * v1.1.0 - group by slug, drop non-article pages, show % captured.
 * v1.2.0 - manual periods (Add this period / Export).
 * v2.0.0 - one click: the script requests the short date ranges itself and
 *   builds 30 / 60 / 90 days / this year in one CSV. Replaces the manual
 *   period buttons.
 * v2.0.1 - stricter slugs: a slug is only letters, numbers and "-", so junk
 *   stuck to the end of a URL (")", "](", "%23...", "&gsessionid=...",
 *   "%22...") is cut off and counted with the real article. Also applied to
 *   ranges saved by 2.0.0, so no need to "Forget saved ranges".
 */

(function () {
  'use strict';

  var SCRIPT_VERSION = '2.0.1';
  var CACHE_KEY = 'hcExportCache_v2';
  var START_CHUNK_DAYS = 7;
  var PAUSE_MS = (typeof module !== 'undefined' && module.__test) ? 0 : 800;           // pause between requests, to be gentle with Mixpanel
  var COMPLETE_PCT = 99;        // a range counts as complete at 99% or more

  var origFetch = window.fetch;
  var template = null;          // { url, headers, body, from, to, reportId }
  var running = false;

  // ---------- small helpers ----------

  var DATE_RE = /\d{4}-\d{2}-\d{2}/;

  function dateOnly(s) { var m = String(s || '').match(DATE_RE); return m ? m[0] : ''; }

  function ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseYmd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); }
  function daysBetween(a, b) { return Math.round((parseYmd(b) - parseYmd(a)) / 86400000); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function isInsightsUrl(url) { return /\/api\/query\/insights/.test(String(url || '')); }

  function headersToObject(h) {
    var out = {};
    if (!h) return out;
    if (typeof h.forEach === 'function' && !Array.isArray(h)) { h.forEach(function (v, k) { out[k] = v; }); return out; }
    if (Array.isArray(h)) { h.forEach(function (p) { out[p[0]] = p[1]; }); return out; }
    Object.keys(h).forEach(function (k) { out[k] = h[k]; });
    return out;
  }

  // ---------- learn the request template from the page's own query ----------

  function rememberTemplate(url, headers, body, json) {
    if (!json || typeof json !== 'object' || !findSeries(json)) return;
    if (Array.isArray(json.headers) && json.headers.indexOf('Page URL') === -1) return;
    if (typeof body !== 'string') return;
    var dr = json.date_range || {};
    var from = dateOnly(dr.from_date), to = dateOnly(dr.to_date);
    var reportId = 'report';
    try {
      var b = JSON.parse(body);
      if (b && b.tracking_props && b.tracking_props.bookmark_id) reportId = String(b.tracking_props.bookmark_id);
    } catch (e) {}
    var hasDates = from && to && body.indexOf(from) !== -1 && body.indexOf(to) !== -1;
    template = { url: url, headers: headers, body: body, from: from, to: to, reportId: reportId, hasDates: hasDates };
    refreshButton();
  }

  if (origFetch) {
    window.fetch = function (input, init) {
      var p = origFetch.apply(this, arguments);
      try {
        var url = typeof input === 'string' ? input : (input && (input.url || input.href || String(input)));
        if (isInsightsUrl(url) && init && typeof init.body === 'string') {
          var headers = headersToObject(init.headers);
          var body = init.body;
          p.then(function (res) {
            res.clone().json().then(function (j) { rememberTemplate(url, headers, body, j); }).catch(function () {});
          }).catch(function () {});
        }
      } catch (e) {}
      return p;
    };
  }

  var origOpen = XMLHttpRequest.prototype.open;
  var origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  var origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__hcUrl = url; this.__hcHeaders = {};
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.setRequestHeader = function (k, v) {
    if (this.__hcHeaders) this.__hcHeaders[k] = v;
    return origSetHeader.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    var xhr = this;
    if (isInsightsUrl(xhr.__hcUrl) && typeof body === 'string') {
      xhr.addEventListener('load', function () {
        try { rememberTemplate(String(xhr.__hcUrl), xhr.__hcHeaders || {}, body, JSON.parse(xhr.responseText)); } catch (e) {}
      });
    }
    return origSend.apply(this, arguments);
  };

  // ---------- parse one Mixpanel response ----------

  function findSeries(json) {
    if (json.series && typeof json.series === 'object') return json.series;
    if (json.results && json.results.series) return json.results.series;
    if (json.data && json.data.series) return json.data.series;
    return null;
  }

  var DATE_KEY = /^\d{4}-\d{2}-\d{2}/;

  // A cell is a number, {all: n}, or a time series {"2026-10-10": n, ...}.
  function num(v) {
    if (typeof v === 'number') return v;
    if (!v || typeof v !== 'object') return null;
    if (typeof v.all === 'number') return v.all;
    var keys = Object.keys(v);
    if (keys.length && keys.every(function (k) { return DATE_KEY.test(k) && typeof v[k] === 'number'; })) {
      return keys.reduce(function (t, k) { return t + v[k]; }, 0);
    }
    return null;
  }

  function skipKey(k) {
    return !k || k.charAt(0) === '$' || k === 'undefined' || k === 'null' || k === 'all';
  }

  function metricName(key) { return String(key).replace(/^[A-Z]\.\s*/, '').trim(); }

  function cleanUrl(u) { return String(u).trim().split(/[?#]/)[0].replace(/\/+$/, '').toLowerCase(); }

  function slugOf(u) {
    var m = u.match(/\/article\/([^\/]+)/);
    if (!m) return '';
    return normSlug(m[1].split(/https?:/)[0]);   // a URL pasted twice keeps the first slug
  }

  // Real slugs are only a-z, 0-9 and "-". Cut at the first other character.
  function normSlug(s) {
    var m = String(s || '').toLowerCase().match(/^[a-z0-9-]+/);
    return m ? m[0].replace(/-+$/, '') : '';
  }

  // -> { cols, rows: {slug: {col: n}}, firstCol, overall, read }
  function parseChunk(json) {
    var series = findSeries(json) || {};
    var cols = [], rows = {}, totals = {};
    var keys = Object.keys(series);
    keys.forEach(function (mKey) {
      var segs = series[mKey];
      if (!segs || typeof segs !== 'object') return;
      var name = metricName(mKey);
      var unique = /unique/i.test(name);
      function add(rawUrl, col, n) {
        totals[col] = (totals[col] || 0) + n;
        if (unique) return;                    // can't be added up, left out
        var slug = slugOf(cleanUrl(rawUrl));
        if (!slug) return;
        if (cols.indexOf(col) === -1) cols.push(col);
        var r = rows[slug] || (rows[slug] = {});
        r[col] = (r[col] || 0) + n;
      }
      Object.keys(segs).forEach(function (url) {
        if (skipKey(url)) return;
        var v = segs[url];
        var n = num(v);
        if (n !== null) { add(url, name, n); return; }
        if (v && typeof v === 'object') {
          Object.keys(v).forEach(function (sub) {
            if (skipKey(sub)) return;
            var m = num(v[sub]);
            if (m !== null) add(url, name + ' - ' + sub, m);
          });
        }
      });
    });
    var firstKey = keys[0];
    var firstName = firstKey ? metricName(firstKey) : '';
    var overall = firstKey && series[firstKey] && series[firstKey].$overall !== undefined ? num(series[firstKey].$overall) : null;
    // "read" = everything Mixpanel sent for the first metric (all sub-columns)
    var read = 0;
    Object.keys(totals).forEach(function (c) { if (c === firstName || c.indexOf(firstName + ' - ') === 0) read += totals[c]; });
    var limitHit = !!(json.meta && json.meta.is_segmentation_limit_hit);
    var pct = overall ? (read / overall * 100) : (limitHit ? 0 : 100);
    if (overall === 0) pct = 100;
    return { cols: cols, rows: rows, pct: pct, limitHit: limitHit };
  }

  // ---------- ask Mixpanel for one date range ----------

  async function queryRange(from, to) {
    var body = template.body.split(template.from).join('__HC_FROM__').split(template.to).join('__HC_TO__')
      .split('__HC_FROM__').join(from).split('__HC_TO__').join(to);
    for (var attempt = 1; attempt <= 4; attempt++) {
      var res = await origFetch(template.url, {
        method: 'POST', headers: template.headers, body: body, credentials: 'include'
      });
      if (res.ok) return res.json();
      if (res.status === 429 || res.status >= 500) { await sleep(5000 * attempt); continue; }
      throw new Error('Mixpanel answered ' + res.status + ' for ' + from + ' to ' + to);
    }
    throw new Error('Mixpanel kept refusing ' + from + ' to ' + to + ' (too many requests). Try again in a few minutes.');
  }

  // ---------- cache of finished ranges ----------

  function loadCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveCache(c) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (e) {}
  }

  // ---------- plan the date ranges ----------

  // Windows end today. Ranges never cross a window start, so every range
  // belongs fully to the windows it is in.
  function windowsFor(today) {
    var year = today.slice(0, 4) + '-01-01';
    var w = [
      { key: '30d', start: addDays(today, -29) },
      { key: '60d', start: addDays(today, -59) },
      { key: '90d', start: addDays(today, -89) },
      { key: 'this year', start: year }
    ];
    return w;
  }

  function planRanges(today, windows) {
    var starts = windows.map(function (w) { return w.start; });
    var earliest = starts.slice().sort()[0];
    var cuts = starts.concat([addDays(today, 1)]).filter(function (s, i, a) { return a.indexOf(s) === i; }).sort();
    var ranges = [];
    for (var i = 0; i < cuts.length - 1; i++) {
      var segStart = cuts[i], segEnd = addDays(cuts[i + 1], -1);
      if (segStart < earliest) continue;
      var cur = segStart;
      while (cur <= segEnd) {
        var end = addDays(cur, START_CHUNK_DAYS - 1);
        if (end > segEnd) end = segEnd;
        ranges.push({ from: cur, to: end });
        cur = addDays(end, 1);
      }
    }
    return ranges;
  }

  // ---------- run ----------

  async function fetchRange(range, today, cache, store, progress) {
    var key = range.from + '|' + range.to;
    var days = daysBetween(range.from, range.to) + 1;
    var half = Math.floor(days / 2);
    var mid = addDays(range.from, half - 1);
    var done = range.to < today;    // ranges that include today are always asked again
    if (done && cache[key] && cache[key].split) {
      await fetchRange({ from: range.from, to: mid }, today, cache, store, progress);
      await fetchRange({ from: addDays(mid, 1), to: range.to }, today, cache, store, progress);
      return;
    }
    if (done && cache[key]) { store.push(cache[key]); return; }
    progress();
    await sleep(PAUSE_MS);
    var parsed = parseChunk(await queryRange(range.from, range.to));
    if (parsed.pct < COMPLETE_PCT && days > 1) {
      if (done) { cache[key] = { split: true }; saveCache(cache); }
      await fetchRange({ from: range.from, to: mid }, today, cache, store, progress);
      await fetchRange({ from: addDays(mid, 1), to: range.to }, today, cache, store, progress);
      return;
    }
    var entry = { from: range.from, to: range.to, cols: parsed.cols, rows: parsed.rows, pct: Math.round(parsed.pct * 10) / 10 };
    if (done) { cache[key] = entry; saveCache(cache); }
    store.push(entry);
  }

  function buildCsv(entries, windows) {
    var cols = [];
    entries.forEach(function (e) { e.cols.forEach(function (c) { if (cols.indexOf(c) === -1) cols.push(c); }); });
    var data = {};
    entries.forEach(function (e) {
      Object.keys(e.rows).forEach(function (rawSlug) {
        var slug = normSlug(rawSlug);
        if (!slug) return;
        var d = data[slug] || (data[slug] = {});
        cols.forEach(function (c) {
          var n = e.rows[rawSlug][c] || 0;
          if (!n) return;
          windows.forEach(function (w) {
            if (e.from >= w.start) { var k = c + ' ' + w.key; d[k] = (d[k] || 0) + n; }
          });
        });
      });
    });
    var header = ['slug', 'article_url'];
    cols.forEach(function (c) { windows.forEach(function (w) { header.push(c + ' ' + w.key); }); });
    var sortKey = cols.length ? cols[0] + ' 30d' : '';
    var slugs = Object.keys(data).sort(function (a, b) { return (data[b][sortKey] || 0) - (data[a][sortKey] || 0); });
    var lines = [header.map(csvCell).join(',')];
    slugs.forEach(function (slug) {
      var line = [slug, 'https://help.thumbtack.com/article/' + slug];
      header.slice(2).forEach(function (k) { line.push(data[slug][k] || 0); });
      lines.push(line.map(csvCell).join(','));
    });
    return { csv: lines.join('\n'), articles: slugs.length };
  }

  function csvCell(v) {
    var s = v === undefined || v === null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function download(name, text) {
    var blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  async function runExport() {
    if (running) return;
    if (!template) {
      alert('No report data yet. Reload the report page (Cmd + R), wait until the table loads, then click again.');
      return;
    }
    if (!template.hasDates) {
      alert('One-time setup: set this report to a Custom date range (any dates), wait for the table, click Save, and then click this button again.');
      return;
    }
    running = true;
    var today = ymd(new Date());
    var windows = windowsFor(today);
    var ranges = planRanges(today, windows);
    var cache = loadCache();
    var allCache = cache[template.reportId] || (cache[template.reportId] = {});
    var entries = [];
    var asked = 0;
    function progress() { asked++; setStatus('Working… ' + asked + ' requests to Mixpanel (' + entries.length + ' ranges done)'); }
    try {
      for (var i = 0; i < ranges.length; i++) {
        await fetchRange(ranges[i], today, allCache, entries, progress);
        cache[template.reportId] = allCache;
        saveCache(cache);
      }
      var out = buildCsv(entries, windows);
      var title = (document.title || 'report').replace(/\s*[|\-–]\s*Mixpanel.*$/i, '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_');
      download('hc_mixpanel_' + (title || 'report') + '_' + today + '.csv', out.csv);
      var incomplete = entries.filter(function (e) { return e.pct < COMPLETE_PCT; });
      var msg = 'Done: ' + out.articles + ' articles, last 30 / 60 / 90 days and this year (through ' + today + ').\n' +
        entries.length + ' date ranges, ' + asked + ' new requests to Mixpanel (the rest came from saved ranges).';
      if (incomplete.length) {
        msg += '\n\nHeads up: ' + incomplete.length + ' single day(s) still had more than 3,000 URL variants, so a few views are missing there: ' +
          incomplete.map(function (e) { return e.from + ' (' + e.pct + '%)'; }).join(', ');
      } else {
        msg += '\n\nEvery range came through complete.';
      }
      alert(msg);
    } catch (e) {
      alert('Export stopped: ' + e.message + '\n\nRanges already finished are saved, so clicking again continues from there.');
    } finally {
      running = false;
      refreshButton();
    }
  }

  function clearCache() {
    if (!confirm('Forget the saved date ranges? The next export will ask Mixpanel for everything again.')) return;
    saveCache({});
    refreshButton();
  }

  // ---------- button ----------

  var box = null, btn = null, status = null;

  function setStatus(t) { if (status) status.textContent = t; }

  function refreshButton() {
    if (!btn) return;
    if (running) return;
    if (!template) { btn.style.opacity = '0.6'; setStatus('Waiting for the report to load…'); return; }
    btn.style.opacity = '1';
    setStatus(template.hasDates ? 'Ready.' : 'Setup: use a Custom date range once and Save the report.');
  }

  function addButton() {
    if (box || !document.body) return;
    box = document.createElement('div');
    box.title = 'Mixpanel HC Export v' + SCRIPT_VERSION;
    box.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;width:290px;background:#fff;' +
      'border-radius:10px;padding:10px;box-shadow:0 2px 12px rgba(0,0,0,.25);font:12px -apple-system,BlinkMacSystemFont,sans-serif;color:#333';
    btn = document.createElement('button');
    btn.textContent = 'Export HC CSV (30 / 60 / 90 days / year)';
    btn.style.cssText = 'display:block;width:100%;background:#4f44e0;color:#fff;border:0;border-radius:8px;' +
      'padding:10px 12px;font:600 13px -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer';
    btn.addEventListener('click', runExport);
    status = document.createElement('div');
    status.style.cssText = 'margin-top:6px';
    var clear = document.createElement('button');
    clear.textContent = 'Forget saved ranges';
    clear.style.cssText = 'display:inline-block;margin-top:4px;padding:0;background:none;border:0;color:#888;' +
      'text-decoration:underline;cursor:pointer;font:12px -apple-system,BlinkMacSystemFont,sans-serif';
    clear.addEventListener('click', clearCache);
    box.appendChild(btn);
    box.appendChild(status);
    box.appendChild(clear);
    document.body.appendChild(box);
    refreshButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton);
  else addButton();

  // test hook (no effect in the browser)
  if (typeof module !== 'undefined') module.exports = { parseChunk: parseChunk, planRanges: planRanges, windowsFor: windowsFor, buildCsv: buildCsv, runExport: runExport, _t: function () { return template; } };
})();
