// ==UserScript==
// @name         Mixpanel HC Export - Content Index
// @namespace    https://thumbtack.com/
// @version      1.0.0
// @updateURL    https://raw.githubusercontent.com/jorgecTT/content-index-tools/main/tampermonkey/mixpanelHcExport.user.js
// @downloadURL  https://raw.githubusercontent.com/jorgecTT/content-index-tools/main/tampermonkey/mixpanelHcExport.user.js
// @description  On a Mixpanel Insights report broken down by Page URL, adds a button that exports ALL rows as a CSV, with Help Center URLs cleaned and grouped per article.
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
 */

(function () {
  'use strict';

  var SCRIPT_VERSION = '1.0.0';
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
    return m ? m[1] : '';
  }

  function build(series) {
    var groups = {};
    var cols = [];
    function addCol(c) { if (cols.indexOf(c) === -1) cols.push(c); }
    function add(rawUrl, col, n) {
      var key = cleanUrl(rawUrl);
      if (!key) return;
      var g = groups[key] || (groups[key] = { url: key, slug: slugOf(key), variants: {}, vals: {} });
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
    return { rows: rows, cols: cols };
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

  // ---------- export ----------

  function dateOnly(s) { return String(s || '').slice(0, 10); }

  function exportCsv() {
    if (!last) {
      alert('No report data yet. Reload the report page (Cmd + R) and wait until the table loads, then click again.');
      return;
    }
    var built = build(last.series);
    if (!built.rows.length) {
      alert('The report loaded, but I could not read the rows. Send a screenshot of the Response tab to Claude.');
      return;
    }
    var dr = last.json.date_range || {};
    var title = (document.title || 'report').replace(/\s*[|\-–]\s*Mixpanel.*$/i, '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_');
    var name = 'hc_mixpanel_' + (title || 'report') + '_' + dateOnly(dr.from_date) + '_to_' + dateOnly(dr.to_date) + '.csv';

    var blob = new Blob(['\uFEFF' + toCsv(built)], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);

    var meta = last.json.meta || {};
    var msg = 'Exported ' + built.rows.length + ' articles.';
    if (meta.is_segmentation_limit_hit) {
      msg += '\n\nNote: Mixpanel hit its 3,000-row limit, so some URL variants with very few views are missing. Top articles are not affected in practice.';
    }
    alert(msg);
  }

  // ---------- button ----------

  var btn = null;

  function refreshButton() {
    if (!btn) return;
    if (last) {
      var count = Object.keys(last.series).reduce(function (n, k) {
        var s = last.series[k];
        return Math.max(n, s && typeof s === 'object' ? Object.keys(s).filter(function (k) { return !skipKey(k); }).length : 0);
      }, 0);
      btn.textContent = 'Export HC CSV (' + count + ' URLs)';
      btn.style.opacity = '1';
    } else {
      btn.textContent = 'Export HC CSV (waiting for report)';
      btn.style.opacity = '0.6';
    }
  }

  function addButton() {
    if (btn || !document.body) return;
    btn = document.createElement('button');
    btn.id = 'hc-export-btn';
    btn.title = 'Mixpanel HC Export v' + SCRIPT_VERSION;
    btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;' +
      'background:#4f44e0;color:#fff;border:0;border-radius:8px;padding:10px 14px;' +
      'font:600 13px -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.25)';
    btn.addEventListener('click', exportCsv);
    document.body.appendChild(btn);
    refreshButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addButton);
  } else {
    addButton();
  }

  // test hook (no effect in the browser)
  if (typeof module !== 'undefined') module.exports = { build: build, toCsv: toCsv, cleanUrl: cleanUrl };
})();
