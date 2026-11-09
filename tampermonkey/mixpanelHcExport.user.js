// ==UserScript==
// @name         Mixpanel HC Export - Content Index
// @namespace    https://thumbtack.com/
// @version      1.2.0
// @updateURL    https://raw.githubusercontent.com/jorgecTT/content-index-tools/main/tampermonkey/mixpanelHcExport.user.js
// @downloadURL  https://raw.githubusercontent.com/jorgecTT/content-index-tools/main/tampermonkey/mixpanelHcExport.user.js
// @description  On a Mixpanel Insights report broken down by Page URL, adds buttons to collect the report one date range at a time and export one CSV with Help Center URLs cleaned and grouped per article.
// @author       jcardona@thumbtack.com
// @match        https://mixpanel.com/project/*
// @noframes
// @grant        none
// @run-at       document-start
// ==/UserScript==

/*
 * MIXPANEL HC EXPORT v1.0.0
 *
 * How it works:
 *   - Mixpanel's page loads each report from /api/query/insights. This script
 *     listens to that same response (it does not send its own request), so it
 *     only sees what the logged-in user already sees.
 *   - Click "Export HC CSV": every URL is cleaned (drops ?query, #anchor,
 *     trailing "/", lowercase) and rows for the same article are summed.
 *   - Works for any report broken down by Page URL, with one or more metrics,
 *     and with a second breakdown (for example Answer = Yes / No for votes).
 *   - Unique viewers can't be added across URL variants, so those columns are
 *     marked "(approx)": they are an upper bound.
 *
 * v1.0.0 - first version: CSV download only. Sending to the Corpus Cache
 *   sheet comes in a later version.
 * v1.1.0 - groups by article slug (so help.thumbtack.com and the old
 *   thumbtack.my.site.com URLs count as one article), keeps only /article/
 *   pages (search and topic pages are counted but left out), fixes URLs that
 *   were pasted twice, and the final message shows what % of the report's
 *   total views made it into the CSV.
 * v1.2.0 - export by periods. Mixpanel only sends 3,000 rows, and a 30-day
 *   report has far more URL variants, so about a third of the views went
 *   missing. Now you add the report one shorter date range at a time
 *   ("Add this period"), each one shows its % captured, and "Export CSV"
 *   adds all periods together into one file. Periods are kept in this
 *   browser until you click "Clear periods".
 */

(function () {
  'use strict';

  var SCRIPT_VERSION = '1.2.0';
  var last = null; // { json, at }

  // ---------- capture Mixpanel's own insights responses ----------

  function isInsightsUrl(url) {
    return /\/api\/query\/insights/.test(String(url || ''));
  }

  function capture(json) {
    if (!json || typeof json !== 'object') return;
    var series = findSeries(json);
    if (!series) return;
    // Only keep the report table (broken down by Page URL), not side queries.
    if (Array.isArray(json.headers) && json.headers.indexOf('Page URL') === -1) return;
    last = { json: json, series: series, at: new Date() };
    refreshButton();
  }

  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function (input) {
      var p = origFetch.apply(this, arguments);
      try {
        var url = typeof input === 'string' ? input : (input && (input.url || input.href || String(input)));
        if (isInsightsUrl(url)) {
          p.then(function (res) {
            res.clone().json().then(capture).catch(function () {});
          }).catch(function () {});
        }
      } catch (e) {}
      return p;
    };
  }

  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__hcUrl = url;
    return origOpen.apply(this, arguments);
  };
  var origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    var xhr = this;
    if (isInsightsUrl(xhr.__hcUrl)) {
      xhr.addEventListener('load', function () {
        try { capture(JSON.parse(xhr.responseText)); } catch (e) {}
      });
    }
    return origSend.apply(this, arguments);
  };

  // ---------- parse ----------

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

  // Skip Mixpanel's own keys ($overall etc.) and empty values.
  function skipKey(k) {
    return !k || k.charAt(0) === '$' || k === 'undefined' || k === 'null' || k === 'all';
  }

  function metricName(key) {
    return String(key).replace(/^[A-Z]\.\s*/, '').trim();
  }

  function cleanUrl(u) {
    return String(u).trim().split(/[?#]/)[0].replace(/\/+$/, '').toLowerCase();
  }

  function slugOf(u) {
    var m = u.match(/\/article\/([^\/]+)/);
    if (!m) return '';
    // A URL pasted twice ("...webhookhttps://...") keeps only the first slug.
    return m[1].split(/https?:/)[0];
  }

  function build(series) {
    var groups = {};
    var cols = [];
    function addCol(c) { if (cols.indexOf(c) === -1) cols.push(c); }
    var stats = { total: {}, kept: {}, dropped: {}, droppedPages: {} };
    function add(rawUrl, col, n) {
      var clean = cleanUrl(rawUrl);
      if (!clean) return;
      addCol(col);
      stats.total[col] = (stats.total[col] || 0) + n;
      var slug = slugOf(clean);
      if (!slug) {
        stats.dropped[col] = (stats.dropped[col] || 0) + n;
        stats.droppedPages[clean] = true;
        return;
      }
      stats.kept[col] = (stats.kept[col] || 0) + n;
      var key = slug;
      var g = groups[key] || (groups[key] = { url: 'https://help.thumbtack.com/article/' + slug, slug: slug, variants: {}, vals: {} });
      g.variants[rawUrl] = true;
      g.vals[col] = (g.vals[col] || 0) + n;
      addCol(col);
    }

    Object.keys(series).forEach(function (mKey) {
      var segs = series[mKey];
      if (!segs || typeof segs !== 'object') return;
      var name = metricName(mKey);
      if (/unique/i.test(name)) name += ' (approx)';
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

    var rows = Object.keys(groups).map(function (k) { return groups[k]; });
    var sortCol = cols[0];
    rows.sort(function (a, b) { return (b.vals[sortCol] || 0) - (a.vals[sortCol] || 0); });
    var overall = null;
    var firstKey = Object.keys(series)[0];
    if (firstKey && series[firstKey] && series[firstKey].$overall !== undefined) overall = num(series[firstKey].$overall);
    return { rows: rows, cols: cols, stats: stats, overall: overall };
  }

  function csvCell(v) {
    var s = v === undefined || v === null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function toCsv(built) {
    var header = ['slug', 'article_url', 'url_variants'].concat(built.cols);
    var lines = [header.map(csvCell).join(',')];
    built.rows.forEach(function (r) {
      var line = [r.slug, r.url, Object.keys(r.variants).length];
      built.cols.forEach(function (c) { line.push(r.vals[c] || 0); });
      lines.push(line.map(csvCell).join(','));
    });
    return lines.join('\n');
  }

  // ---------- periods (export the report week by week, then combine) ----------

  var STORE_KEY = 'hcExportPeriods_v1';

  function dateOnly(s) { return String(s || '').slice(0, 10); }

  function loadPeriods() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]') || []; } catch (e) { return []; }
  }
  function savePeriods(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function periodFromCapture(cap) {
    var built = build(cap.series);
    var dr = cap.json.date_range || {};
    var c0 = built.cols[0];
    var read = built.stats.total[c0] || 0;
    return {
      from: dateOnly(dr.from_date),
      to: dateOnly(dr.to_date),
      cols: built.cols,
      overall: built.overall,
      read: read,
      pct: built.overall ? Math.round(read / built.overall * 1000) / 10 : null,
      limitHit: !!(cap.json.meta && cap.json.meta.is_segmentation_limit_hit),
      droppedPages: Object.keys(built.stats.droppedPages).length,
      droppedViews: built.stats.dropped[c0] || 0,
      rows: built.rows.map(function (r) {
        return { slug: r.slug, url: r.url, variants: Object.keys(r.variants).length, vals: r.vals };
      })
    };
  }

  function combine(periods) {
    var groups = {};
    var cols = [];
    periods.forEach(function (p) {
      p.cols.forEach(function (c) { if (cols.indexOf(c) === -1) cols.push(c); });
      p.rows.forEach(function (r) {
        var g = groups[r.slug] || (groups[r.slug] = { slug: r.slug, url: r.url, variants: 0, vals: {} });
        g.variants += r.variants;
        Object.keys(r.vals).forEach(function (c) { g.vals[c] = (g.vals[c] || 0) + r.vals[c]; });
      });
    });
    var rows = Object.keys(groups).map(function (k) { return groups[k]; });
    rows.sort(function (a, b) { return (b.vals[cols[0]] || 0) - (a.vals[cols[0]] || 0); });
    return { rows: rows, cols: cols };
  }

  function combinedCsv(comb) {
    var header = ['slug', 'article_url', 'url_variants'].concat(comb.cols);
    var lines = [header.map(csvCell).join(',')];
    comb.rows.forEach(function (r) {
      var line = [r.slug, r.url, r.variants];
      comb.cols.forEach(function (c) { line.push(r.vals[c] || 0); });
      lines.push(line.map(csvCell).join(','));
    });
    return lines.join('\n');
  }

  function fmtPct(p) { return p === null ? '?' : p + '%'; }

  function addPeriod() {
    if (!last) {
      alert('No report data yet. Reload the report page (Cmd + R) and wait until the table loads, then click again.');
      return;
    }
    var p = periodFromCapture(last);
    if (!p.rows.length) {
      alert('The report loaded, but I could not read the rows. Send a screenshot of the Response tab to Claude.');
      return;
    }
    if (p.pct !== null && p.pct < 99) {
      var keep = confirm('Period ' + p.from + ' to ' + p.to + ' is incomplete: only ' + fmtPct(p.pct) +
        ' of its ' + (p.cols[0] || 'views') + ' came through (Mixpanel\'s 3,000-row limit).\n\n' +
        'Click Cancel, then pick a shorter date range (for example 3 or 4 days).\n' +
        'Click OK only if you want to add it anyway.');
      if (!keep) return;
    }
    var list = loadPeriods().filter(function (q) { return !(q.from === p.from && q.to === p.to); });
    var overlap = list.filter(function (q) { return p.from <= q.to && p.to >= q.from; });
    if (overlap.length) {
      var ok = confirm('This period (' + p.from + ' to ' + p.to + ') overlaps one you already added (' +
        overlap.map(function (q) { return q.from + ' to ' + q.to; }).join(', ') +
        '). Views would be counted twice.\n\nAdd it anyway?');
      if (!ok) return;
    }
    list.push(p);
    list.sort(function (a, b) { return a.from < b.from ? -1 : 1; });
    savePeriods(list);
    refreshButton();

    var msg = 'Added ' + p.from + ' to ' + p.to + ': ' + p.rows.length + ' articles.\n' +
      'Captured ' + fmtPct(p.pct) + ' of this period\'s ' + (p.cols[0] || 'views') + '.';
    msg += '\n\nNext: change the date range to the next period, wait for the table, and click Add again. ' +
      'When all periods are in, click Export CSV.';
    alert(msg);
  }

  function exportCombined() {
    var list = loadPeriods();
    if (!list.length) { alert('No periods added yet. Click "Add this period" first.'); return; }
    var comb = combine(list);
    var title = (document.title || 'report').replace(/\s*[|\-–]\s*Mixpanel.*$/i, '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_');
    var name = 'hc_mixpanel_' + (title || 'report') + '_' + list[0].from + '_to_' + list[list.length - 1].to + '.csv';
    var blob = new Blob(['\uFEFF' + combinedCsv(comb)], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);

    var lines = list.map(function (q) {
      return '  ' + q.from + ' to ' + q.to + ': ' + fmtPct(q.pct) + (q.pct !== null && q.pct < 99 ? '  <- incomplete' : '');
    });
    alert('Exported ' + comb.rows.length + ' articles from ' + list.length + ' periods.\n\n' + lines.join('\n') +
      '\n\nUnique viewers are approximate (added across URL variants and periods).');
  }

  function clearPeriods() {
    var n = loadPeriods().length;
    if (!n) { alert('Nothing to clear.'); return; }
    if (!confirm('Remove the ' + n + ' periods you added?')) return;
    savePeriods([]);
    refreshButton();
  }

  // ---------- buttons ----------

  var box = null, btnAdd = null, btnExport = null, btnClear = null;

  function refreshButton() {
    if (!box) return;
    var list = loadPeriods();
    if (last) {
      var dr = last.json.date_range || {};
      btnAdd.textContent = 'Add this period (' + dateOnly(dr.from_date) + ' to ' + dateOnly(dr.to_date) + ')';
      btnAdd.style.opacity = '1';
    } else {
      btnAdd.textContent = 'Add this period (waiting for report)';
      btnAdd.style.opacity = '0.6';
    }
    btnExport.textContent = 'Export CSV (' + list.length + ' period' + (list.length === 1 ? '' : 's') + ')';
    btnExport.style.opacity = list.length ? '1' : '0.6';
  }

  function makeBtn(label, bg, onClick) {
    var b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'display:block;width:100%;margin-top:6px;background:' + bg + ';color:#fff;border:0;' +
      'border-radius:8px;padding:9px 12px;font:600 13px -apple-system,BlinkMacSystemFont,sans-serif;' +
      'cursor:pointer;text-align:left';
    b.addEventListener('click', onClick);
    return b;
  }

  function addButton() {
    if (box || !document.body) return;
    box = document.createElement('div');
    box.id = 'hc-export-box';
    box.title = 'Mixpanel HC Export v' + SCRIPT_VERSION;
    box.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;width:300px;' +
      'background:#fff;border-radius:10px;padding:4px 10px 10px;box-shadow:0 2px 12px rgba(0,0,0,.25)';
    btnAdd = makeBtn('', '#4f44e0', addPeriod);
    btnExport = makeBtn('', '#1f7a4d', exportCombined);
    btnClear = makeBtn('Clear periods', '#8a8a8a', clearPeriods);
    box.appendChild(btnAdd);
    box.appendChild(btnExport);
    box.appendChild(btnClear);
    document.body.appendChild(box);
    refreshButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addButton);
  } else {
    addButton();
  }

  // test hook (no effect in the browser)
  if (typeof module !== 'undefined') module.exports = { build: build, toCsv: toCsv, cleanUrl: cleanUrl, periodFromCapture: periodFromCapture, combine: combine, combinedCsv: combinedCsv };
})();
