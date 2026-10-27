/**
 * ================================================================
 * Content Audit — Slug Aliases  (SlugAliases.gs)
 * v1.1.0
 * ================================================================
 * Lives in the SAME Apps Script project as CorpusSync.gs, WebApp.gs,
 * LocalizationTracker.gs and UrlIndex.gs. Reuses
 * CORPUS_SHEET_ID_LITERAL from CorpusSync.gs and URLINDEX_TAB_NAME /
 * URLINDEX_COLUMNS from UrlIndex.gs — do not redeclare.
 *
 * v1.1.0 changes (soft-404 protection — the real-world fix):
 *   - help.thumbtack.com returns HTTP 200 even for slugs that DO NOT
 *     exist (SPA soft-404), so a 200 alone is no longer proof of life.
 *     A 200 slug is now verified against OUR OWN url_index tab (the
 *     published urlEN/urlES/urlPT columns). Found -> confirmed live.
 *     Not found -> explicit failure ("likely a soft-404"), nothing
 *     recorded as valid.
 *   - Redirect targets (301/302/307/308) are still accepted (a real
 *     redirect is strong evidence) but are ALSO checked against the
 *     url_index; if absent, the row gets a visible warning note.
 *
 * WHAT IT DOES:
 *   Maintains a 'slug_aliases' tab in the corpus Sheet mapping OLD
 *   Help Center slugs (renamed articles, old email templates) to
 *   their CURRENT slugs, resolved automatically by following the
 *   help.thumbtack.com redirect server-side (UrlFetchApp CAN read
 *   redirects — the Claude sandbox cannot).
 *
 * TWO WAYS TO RESOLVE:
 *   - On-demand, one slug: WebApp v1.9.8 POST/GET mode=slug_alias_add
 *     calls slugAliasAdd_() below — adds + resolves + returns the
 *     current slug in one round trip. This is the main path.
 *   - Bulk: paste oldSlugs by hand in the tab (currentSlug empty),
 *     run resolveSlugAliases() from the editor — fills the pending ones.
 *
 * SAFETY:
 *   - WRITES ONLY to the 'slug_aliases' tab.
 *   - Failures are written visibly in 'notes' (soft-404, 404, no
 *     redirect, redirect outside /article/) — never guessed.
 *
 * SCHEMA (slug_aliases):
 *   oldSlug | currentSlug | resolvedDate | source | notes
 * ================================================================ */

var SLUGALIAS_TAB_NAME = 'slug_aliases';
var SLUGALIAS_COLUMNS = ['oldSlug', 'currentSlug', 'resolvedDate', 'source', 'notes'];

var SLUGALIAS_BASE_URL = 'https://help.thumbtack.com/article/';


/* ================================================================
 * CORE — add (or look up) ONE alias and resolve it via the redirect.
 * Called by the WebApp endpoint and by the bulk resolver.
 * Returns { ok, oldSlug, currentSlug, cached, note } or { ok:false, error }.
 * ================================================================ */
function slugAliasAdd_(oldSlugRaw, source) {
  var oldSlug = slugAliasNormalize_(oldSlugRaw);
  if (!oldSlug) {
    return { ok: false, error: 'Empty or unparseable slug: "' + String(oldSlugRaw) + '"' };
  }

  var sh = slugAliasSheet_();

  // ---- Dedupe: if this oldSlug is already known, return it without fetching ----
  var last = sh.getLastRow();
  if (last > 1) {
    var vals = sh.getRange(2, 1, last - 1, SLUGALIAS_COLUMNS.length).getValues();
    for (var r = 0; r < vals.length; r++) {
      if (String(vals[r][0] || '').trim().toLowerCase() === oldSlug.toLowerCase()) {
        var known = String(vals[r][1] || '').trim();
        if (known) {
          return { ok: true, oldSlug: oldSlug, currentSlug: known, cached: true, note: '' };
        }
        // Row exists but unresolved — resolve it in place.
        var res0 = slugAliasResolve_(oldSlug);
        sh.getRange(r + 2, 2, 1, 4).setValues([[
          res0.currentSlug, res0.currentSlug ? new Date().toISOString().slice(0, 10) : '',
          String(vals[r][3] || source || ''), res0.note
        ]]);
        if (!res0.currentSlug) return { ok: false, error: res0.note, oldSlug: oldSlug };
        return { ok: true, oldSlug: oldSlug, currentSlug: res0.currentSlug, cached: false, note: res0.note };
      }
    }
  }

  // ---- New slug: resolve, then write the full row ----
  var res = slugAliasResolve_(oldSlug);
  sh.appendRow([
    oldSlug,
    res.currentSlug,
    res.currentSlug ? new Date().toISOString().slice(0, 10) : '',
    String(source || ''),
    res.note
  ]);

  if (!res.currentSlug) return { ok: false, error: res.note, oldSlug: oldSlug };
  return { ok: true, oldSlug: oldSlug, currentSlug: res.currentSlug, cached: false, note: res.note };
}


/* ================================================================
 * RESOLVER — follows ONE redirect hop server-side, then validates
 * against the url_index (soft-404 protection, v1.1.0).
 * Returns { currentSlug, note }. currentSlug === '' means failure;
 * the note says why (always visible, never guessed).
 * ================================================================ */
function slugAliasResolve_(oldSlug) {
  var resp;
  try {
    resp = UrlFetchApp.fetch(SLUGALIAS_BASE_URL + encodeURIComponent(oldSlug), {
      followRedirects: false,
      muteHttpExceptions: true
    });
  } catch (err) {
    return { currentSlug: '', note: 'fetch error: ' + String(err).slice(0, 120) };
  }

  var code = resp.getResponseCode();

  // 200 is NOT proof of life (help.thumbtack.com soft-404s).
  // The slug must also exist in our own url_index.
  if (code === 200) {
    if (slugExistsInUrlIndex_(oldSlug)) {
      return { currentSlug: oldSlug, note: 'slug is live (verified in url_index)' };
    }
    return { currentSlug: '',
             note: 'returns 200 but slug not found in url_index — likely a soft-404 (article does not exist). Verify manually.' };
  }

  if (code === 301 || code === 302 || code === 307 || code === 308) {
    var headers = resp.getAllHeaders();
    var loc = String(headers['Location'] || headers['location'] || '').trim();
    if (!loc) {
      return { currentSlug: '', note: 'redirect (' + code + ') without Location header' };
    }
    var m = loc.match(/\/article\/([^\/?#\s]+)/);
    if (!m) {
      return { currentSlug: '', note: 'redirects outside /article/: ' + loc.slice(0, 120) };
    }
    var target = decodeURIComponent(m[1]);
    if (target.toLowerCase() === oldSlug.toLowerCase()) {
      return { currentSlug: '', note: 'redirects to itself — cannot resolve' };
    }
    // A real redirect is strong evidence; validate the target as a bonus.
    if (slugExistsInUrlIndex_(target)) {
      return { currentSlug: target, note: '' };
    }
    return { currentSlug: target,
             note: 'WARNING: redirect target "' + target + '" not found in url_index — verify (may be a KA-lane or brand-new article)' };
  }

  if (code === 404) {
    return { currentSlug: '', note: '404 — article no longer exists' };
  }

  return { currentSlug: '', note: 'unexpected HTTP ' + code };
}


/* ================================================================
 * SOFT-404 GUARD — is this slug present in any published url of the
 * url_index tab (urlEN / urlES / urlPT)? Case-insensitive.
 * ================================================================ */
function slugExistsInUrlIndex_(slug) {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var sh = ss.getSheetByName(URLINDEX_TAB_NAME);
  if (!sh || sh.getLastRow() < 2) return false;   // no index -> cannot verify -> fail safe

  var iEN = URLINDEX_COLUMNS.indexOf('urlEN') + 1;
  var n = sh.getLastRow() - 1;
  // urlEN, urlES, urlPT are contiguous columns — one read.
  var urls = sh.getRange(2, iEN, n, 3).getValues();

  var want = '/article/' + String(slug).toLowerCase();
  for (var r = 0; r < n; r++) {
    for (var c = 0; c < 3; c++) {
      var u = String(urls[r][c] || '').toLowerCase();
      if (!u) continue;
      // Match the exact slug segment (not a prefix of a longer slug).
      var pos = u.indexOf(want);
      if (pos !== -1) {
        var after = u.charAt(pos + want.length);
        if (after === '' || after === '/' || after === '?' || after === '#') return true;
      }
    }
  }
  return false;
}


/* ================================================================
 * BULK — resolve every row whose currentSlug is still empty.
 * For hand-pasted batches. Run from the editor.
 * ================================================================ */
function resolveSlugAliases() {
  var sh = slugAliasSheet_();
  var last = sh.getLastRow();
  if (last < 2) { Logger.log('slug_aliases is empty — nothing to resolve.'); return; }

  var vals = sh.getRange(2, 1, last - 1, SLUGALIAS_COLUMNS.length).getValues();
  var resolved = 0, failed = 0, skipped = 0;

  for (var r = 0; r < vals.length; r++) {
    var oldSlug = slugAliasNormalize_(vals[r][0]);
    var current = String(vals[r][1] || '').trim();
    if (!oldSlug || current) { skipped++; continue; }

    var res = slugAliasResolve_(oldSlug);
    sh.getRange(r + 2, 2, 1, 4).setValues([[
      res.currentSlug,
      res.currentSlug ? new Date().toISOString().slice(0, 10) : '',
      String(vals[r][3] || 'bulk'),
      res.note
    ]]);
    if (res.currentSlug) { resolved++; } else { failed++; }
    Utilities.sleep(300);   // be polite to the Help Center
  }

  Logger.log('Slug aliases — resolved: ' + resolved + ' | failed (see notes): ' + failed + ' | skipped: ' + skipped);
}


/* ================================================================
 * HELPERS
 * ================================================================ */
function slugAliasSheet_() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var sh = ss.getSheetByName(SLUGALIAS_TAB_NAME);
  if (!sh) {
    sh = ss.insertSheet(SLUGALIAS_TAB_NAME);
    sh.getRange(1, 1, 1, SLUGALIAS_COLUMNS.length).setValues([SLUGALIAS_COLUMNS]);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Accepts a bare slug OR a full help.thumbtack.com URL; returns the slug.
function slugAliasNormalize_(raw) {
  var s = String(raw || '').trim();
  if (!s) return '';
  var m = s.match(/\/article\/([^\/?#\s]+)/);
  if (m) s = m[1];
  s = s.replace(/^\/+|\/+$/g, '').split('?')[0].split('#')[0];
  try { s = decodeURIComponent(s); } catch (e) { /* keep as-is */ }
  return s.trim();
}