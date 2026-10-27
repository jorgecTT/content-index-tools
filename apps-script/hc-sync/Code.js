/**
 * HC Sync — Google Apps Script backend (v6.5.0)
 *
 * v6.5.0: TABLES + HYPERLINKS.
 *   - Embedded "table" entries (fields.table.tableData) are now written as real
 *     Google Docs tables (first row bold as header).
 *   - Hyperlinks are kept: "hyperlink" uses data.uri, "entry-hyperlink" resolves
 *     to https://help.thumbtack.com/article/<slug> (segments link to the current
 *     article), "asset-hyperlink" uses the asset file URL.
 *   - List items now keep bold/italic/links.
 *   - Fixed run-offset bug: whitespace is cleaned per run, so bold/link
 *     positions always match the written text.
 *
 * v6.4.0: DOUBLE-CHECK duplicate matching by slug + URL.
 * v6.3.1 change: reviewer field is now required.
 * v6.3 change: added doPost(e) handler for the Python batch tool.
 * v6.2.2 change: reviewer name now appears next to date in Current refresh.
 * v6.2.1 hotfix: applyRunMarks index guard.
 * v6.2 spacing: more breathing room between sections.
 * v6.1 fix: headings now properly tagged with DocumentApp.ParagraphHeading.
 */

// ============================================================
// CONFIG
// ============================================================

var FOLDER_ID = '1Eh0jaXmPFWx-YjntLh73xxdWni32IeqP';

var CONTENTFUL_SPACE_ID = 'zkjkphkd3oqx';
var CONTENTFUL_ENV = 'master';
var CONTENTFUL_TOKEN = 'wYRv1oJP9HTiR8n_YD_qcdIrJBCPv1bBkOIscTmOSWE';
var CONTENTFUL_BASE = 'https://cdn.contentful.com/spaces/' + CONTENTFUL_SPACE_ID +
                      '/environments/' + CONTENTFUL_ENV;

var KNOWN_REVIEWERS = ['Alex', 'Tiffany', 'Nathan', 'Nichole', 'Rachel'];
var MAX_DESCRIPTION_CHARS = 24000;

var HC_ARTICLE_BASE = 'https://help.thumbtack.com/article/';

// Shared secret for the batch tool's doPost endpoint.
var SHARED_SECRET = 'H3lpC3nt3r-VJOo8qkYF5gBPTCVwDXYmT979v2c7tW8';


// ============================================================
// WEB APP
// ============================================================

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('HC Sync')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getKnownReviewers() {
  return KNOWN_REVIEWERS;
}

function getTodayDate() {
  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  var d = new Date();
  return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
}


// ============================================================
// MAIN ENTRY POINT
// ============================================================

function refreshArticle(formData) {
  var url        = (formData.url         || '').trim();
  var mode       = (formData.mode        || 'update').trim();
  var reviewer   = (formData.reviewer    || '').trim();
  var publishDate = (formData.publishDate || '').trim() || getTodayDate();
  var oldUrl     = (formData.oldUrl      || '').trim();

  if (!url) throw new Error('URL is required.');
  if (!reviewer) throw new Error('Reviewer is required. Please select your name from the dropdown.');

  var slug = extractSlugFromUrl(url);
  if (!slug) throw new Error('Could not extract article slug from URL: ' + url);

  var article = fetchArticleFromContentful(slug);
  if (!article) {
    throw new Error(
      'Article not found in Contentful (slug: ' + slug + '). ' +
      'Make sure the URL points to a published Help Center article.'
    );
  }

  var blocks = parseArticleToBlocks(article);
  var fields  = article.item.fields || {};
  var title   = fields.title || 'Untitled';
  var normalizedUrl = normalizeUrl(url);
  var lastModifiedStr = formatDateLong(article.latestContentUpdate);

  if (mode === 'create') {
    return createDoc(normalizedUrl, slug, title, publishDate, reviewer, lastModifiedStr, blocks, fields, article);
  }
  return updateDoc(normalizedUrl, slug, oldUrl, title, publishDate, reviewer, lastModifiedStr, blocks);
}


// ============================================================
// MODE: UPDATE
// ============================================================

function updateDoc(normalizedUrl, slug, oldUrl, title, publishDate, reviewer, lastModifiedStr, blocks) {
  var searchUrl = (oldUrl && normalizeUrl(oldUrl)) ? normalizeUrl(oldUrl) : normalizedUrl;

  var match = findDocBySlugOrUrl(slug, searchUrl);
  if (!match.file) {
    var hint = oldUrl
      ? 'No Doc found matching the old URL "' + searchUrl + '" or slug "' + slug + '" either. Check that the old URL is correct.'
      : 'If this is a new article, switch to "Create new Doc". ' +
        'If the article URL changed in Contentful, paste the old URL in the field below.';
    throw new Error(JSON.stringify({
      code: 'DOC_NOT_FOUND',
      message: 'No Doc in the folder matches slug "' + slug + '" or URL "' + searchUrl + '". ' + hint,
    }));
  }

  var file = match.file;
  Logger.log('updateDoc: matched by ' + match.matchedBy);

  var fileId = file.getId();
  var previousRefresh = readCurrentRefreshLine(fileId) || '—';
  var currentRefreshLine = publishDate + (reviewer ? ' — ' + reviewer : '');

  var headerLines = [
    'Published link: ' + normalizedUrl,
    'Slug: ' + slug,
    'Current refresh: ' + currentRefreshLine,
    'Previous refresh: ' + previousRefresh,
    'Last modified in source: ' + lastModifiedStr,
  ];

  var doc = DocumentApp.openById(fileId);
  writeDocHeader(doc, headerLines);
  writeDocBody(doc, blocks);
  doc.saveAndClose();

  var versionName = title + ' — ' + publishDate + (reviewer ? ' (' + reviewer + ')' : '');
  nameCurrentVersion(fileId, versionName);

  var now = new Date();
  var auditLine = '[' + Utilities.formatDate(now, 'UTC', 'yyyy-MM-dd HH:mm') + ' UTC]' +
    ' Updated by ' + (reviewer || 'unknown') +
    ' | ' + title + ' | ' + publishDate;
  updateDescriptionLog(file, auditLine);

  return {
    status: 'ok',
    mode: 'update',
    docUrl: 'https://docs.google.com/document/d/' + fileId + '/edit',
    docTitle: title,
    docFilename: file.getName(),
    matchedBy: match.matchedBy,
    issues: [],
  };
}


// ============================================================
// MODE: CREATE
// ============================================================

function createDoc(normalizedUrl, slug, title, publishDate, reviewer, lastModifiedStr, blocks, fields, article) {
  var existing = findDocBySlugOrUrl(slug, normalizedUrl);
  if (existing.file) {
    throw new Error(JSON.stringify({
      code: 'ALREADY_EXISTS',
      message: 'A Doc already exists for this article: "' + existing.file.getName() + '" (matched by ' + existing.matchedBy + '). ' +
               'Switch to "Update existing" instead.',
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

  var filename = buildFilename(title, 'external', audience, language);
  var currentRefreshLine = publishDate + (reviewer ? ' — ' + reviewer : '');

  var headerLines = [
    'Published link: ' + normalizedUrl,
    'Slug: ' + slug,
    'Current refresh: ' + currentRefreshLine,
    'Previous refresh: —',
    'Last modified in source: ' + lastModifiedStr,
  ];

  var folder = DriveApp.getFolderById(FOLDER_ID);
  var newFile = DocumentApp.create(filename);
  var newFileId = newFile.getId();

  var driveFile = DriveApp.getFileById(newFileId);
  folder.addFile(driveFile);
  DriveApp.getRootFolder().removeFile(driveFile);

  writeDocHeader(newFile, headerLines);
  writeDocBody(newFile, blocks);
  newFile.saveAndClose();

  var versionName = title + ' — ' + publishDate + (reviewer ? ' (' + reviewer + ')' : '') + ' (created)';
  nameCurrentVersion(newFileId, versionName);

  var now = new Date();
  var auditLine = '[' + Utilities.formatDate(now, 'UTC', 'yyyy-MM-dd HH:mm') + ' UTC]' +
    ' Created by ' + (reviewer || 'unknown') +
    ' | ' + title + ' | ' + publishDate;
  updateDescriptionLog(driveFile, auditLine);

  return {
    status: 'ok',
    mode: 'create',
    docUrl: 'https://docs.google.com/document/d/' + newFileId + '/edit',
    docTitle: title,
    docFilename: filename,
    issues: issues,
  };
}


// ============================================================
// DOC WRITING — HEADER
// ============================================================

function writeDocHeader(doc, lines) {
  var header = doc.getHeader();
  if (!header) {
    header = doc.addHeader();
  }
  header.clear();

  lines.forEach(function(line) {
    var para = header.appendParagraph(line);
    para.setHeading(DocumentApp.ParagraphHeading.NORMAL);
    para.setSpacingBefore(0);
    para.setSpacingAfter(0);
    styleHeader(para);
  });

  var first = header.getChild(0);
  if (first &&
      first.getType() === DocumentApp.ElementType.PARAGRAPH &&
      first.asParagraph().getText() === '' &&
      header.getNumChildren() > lines.length) {
    first.removeFromParent();
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
  var body = doc.getBody();
  body.clear();
  var addedContent = false;

  blocks.forEach(function(b) {
    if (appendBlockToBody_(body, b)) addedContent = true;
  });

  if (addedContent && body.getNumChildren() > 1) {
    var first = body.getChild(0);
    if (first &&
        first.getType() === DocumentApp.ElementType.PARAGRAPH &&
        first.asParagraph().getText() === '') {
      first.removeFromParent();
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
// DOC FINDING
// ============================================================

function findDocBySlugOrUrl(targetSlug, targetUrl) {
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var files = folder.getFilesByType(MimeType.GOOGLE_DOCS);

  var normalizedTargetUrl = normalizeUrl(targetUrl);
  var normalizedTargetSlug = (targetSlug || '').trim().toLowerCase();

  var slugMatch = null;
  var urlMatch  = null;

  while (files.hasNext()) {
    var file = files.next();
    try {
      var headerInfo = readHeaderInfo(file);

      if (normalizedTargetSlug && headerInfo.slug &&
          headerInfo.slug.toLowerCase() === normalizedTargetSlug) {
        slugMatch = file;
        break;
      }

      if (!urlMatch && headerInfo.publishedLink &&
          normalizeUrl(headerInfo.publishedLink) === normalizedTargetUrl) {
        urlMatch = file;
      }
    } catch (e) {
      // Skip unreadable Doc
    }
  }

  if (slugMatch) {
    Logger.log('findDocBySlugOrUrl: matched by slug = ' + normalizedTargetSlug);
    return { file: slugMatch, matchedBy: 'slug' };
  }
  if (urlMatch) {
    Logger.log('findDocBySlugOrUrl: matched by URL = ' + normalizedTargetUrl);
    return { file: urlMatch, matchedBy: 'url' };
  }
  Logger.log('findDocBySlugOrUrl: no match for slug "' + normalizedTargetSlug +
             '" or URL "' + normalizedTargetUrl + '"');
  return { file: null };
}

function readHeaderInfo(file) {
  var doc = DocumentApp.openById(file.getId());
  var info = { slug: '', publishedLink: '' };

  function scanContainer(container, maxLines) {
    if (!container) return;
    var n = container.getNumChildren();
    for (var i = 0; i < Math.min(n, maxLines); i++) {
      var child = container.getChild(i);
      if (child.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;
      var line = child.asParagraph().getText().trim();
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
  if (!info.publishedLink && !info.slug) {
    scanContainer(doc.getBody(), 8);
  }
  return info;
}

function readCurrentRefreshLine(fileId) {
  var doc = DocumentApp.openById(fileId);
  var header = doc.getHeader();
  if (!header) return null;

  var numChildren = header.getNumChildren();
  for (var i = 0; i < Math.min(numChildren, 8); i++) {
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
// DATE HELPERS
// ============================================================

function formatDateShort(date) {
  var y = date.getUTCFullYear();
  var m = String(date.getUTCMonth() + 1).padStart(2, '0');
  var d = String(date.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function formatDateLong(isoStr) {
  if (!isoStr) return 'Unknown';
  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  try {
    var d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    var month = MONTHS[d.getUTCMonth()];
    var day   = d.getUTCDate();
    var year  = d.getUTCFullYear();
    var h     = d.getUTCHours();
    var min   = String(d.getUTCMinutes()).padStart(2, '0');
    var ampm  = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return month + ' ' + day + ', ' + year + ' at ' + h + ':' + min + ' ' + ampm;
  } catch (e) {
    return isoStr;
  }
}


// ============================================================
// AUDIT + VERSION
// ============================================================

function updateDescriptionLog(file, newLine) {
  var existing = file.getDescription() || '';
  var updated  = newLine + '\n' + existing;
  if (updated.length > MAX_DESCRIPTION_CHARS) {
    updated = updated.slice(0, MAX_DESCRIPTION_CHARS);
  }
  file.setDescription(updated);
}

function nameCurrentVersion(fileId, versionName) {
  try {
    var allRevisions = Drive.Revisions.list(fileId, { fields: 'items(id)' });
    if (!allRevisions.items || allRevisions.items.length === 0) return;
    var latestId = allRevisions.items[allRevisions.items.length - 1].id;
    Drive.Revisions.update(
      { keepForever: true, name: versionName },
      fileId,
      latestId
    );
  } catch (e) {
    Logger.log('nameCurrentVersion warning: ' + e.message);
  }
}


// ============================================================
// CONTENTFUL FETCH
// ============================================================

function extractSlugFromUrl(url) {
  var m = (url || '').match(/\/article\/([^/?#]+)/);
  return m ? m[1] : null;
}

function fetchArticleFromContentful(slug) {
  var params = {
    content_type: 'helpCenterArticle',
    'fields.slug': slug,
    include: 10,
  };
  var queryString = Object.keys(params).map(function(k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');

  var apiUrl = CONTENTFUL_BASE + '/entries?' + queryString;
  var response = UrlFetchApp.fetch(apiUrl, {
    headers: { 'Authorization': 'Bearer ' + CONTENTFUL_TOKEN },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(
      'Contentful API error ' + response.getResponseCode() + ': ' +
      response.getContentText().slice(0, 200)
    );
  }

  var data = JSON.parse(response.getContentText());
  if (!data.items || data.items.length === 0) return null;

  var includes = { entries: {}, assets: {} };
  ((data.includes || {}).Entry || []).forEach(function(e) {
    includes.entries[e.sys.id] = e;
  });
  ((data.includes || {}).Asset || []).forEach(function(a) {
    includes.assets[a.sys.id] = a;
  });

  var item   = data.items[0];
  var latest = item.sys.updatedAt || '';
  ((data.includes || {}).Entry || []).forEach(function(e) {
    var eu = (e.sys || {}).updatedAt || '';
    if (eu > latest) latest = eu;
  });

  return { item: item, includes: includes, latestContentUpdate: latest };
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
  var hasPro = false;
  var hasCustomer = false;
  audienceArr.forEach(function(a) {
    var lower = (a || '').toLowerCase();
    if (/pro|profesional|professional/.test(lower)) hasPro = true;
    if (/customer|cliente|homeowner/.test(lower)) hasCustomer = true;
  });
  if (hasPro && hasCustomer) return 'pro and customer';
  if (hasPro) return 'pro';
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
  if (/\[Spanish\]|\[Español\]/i.test(name)) return 'ES';
  if (/\[Portuguese\]/i.test(name)) return 'PT';

  return 'EN';
}

function extractBodySample(bodyField, maxChars) {
  if (!bodyField || !bodyField.content) return '';
  var parts = [];
  var total = 0;
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
  var s = url.trim();
  var hashIdx = s.indexOf('#');
  if (hashIdx !== -1) s = s.substring(0, hashIdx);
  var queryIdx = s.indexOf('?');
  if (queryIdx !== -1) s = s.substring(0, queryIdx);
  s = s.replace(/\/+$/, '').toLowerCase();
  return s;
}

function sanitizeFilename(name) {
  return (name || '').replace(/[<>:"/\\|?*\r\n]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
}


// ============================================================
// TEST HELPERS
// ============================================================

function testListFolder() {
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var files  = folder.getFilesByType(MimeType.GOOGLE_DOCS);
  var count  = 0;
  while (files.hasNext() && count < 10) {
    var file = files.next();
    try {
      var info = readHeaderInfo(file);
      Logger.log(file.getName() +
                 '  →  slug: ' + (info.slug || '(none)') +
                 '  |  link: ' + (info.publishedLink || '(none)'));
    } catch (e) {
      Logger.log(file.getName() + '  →  ERROR: ' + e.message);
    }
    count++;
  }
}

function testFetchArticle() {
  var slug    = 'thumbtack-phone-numbers-on-direct-leads';
  var article = fetchArticleFromContentful(slug);
  if (!article) {
    Logger.log('Article not found: ' + slug);
    return;
  }
  var blocks = parseArticleToBlocks(article);
  var tables = blocks.filter(function(b) { return b.type === 'table'; }).length;
  var links = 0;
  blocks.forEach(function(b) { (b.runs || []).forEach(function(r) { if (r.link) links++; }); });
  Logger.log('Fetched: ' + (article.item.fields.title || slug));
  Logger.log('Block count: ' + blocks.length + ' | tables: ' + tables + ' | links: ' + links);
}


// ============================================================
// POST HANDLER — for run_batch.py (batch tool)
// ============================================================

function doPost(e) {
  try {
    var req;
    try {
      req = JSON.parse(e.postData.contents);
    } catch (_) {
      return jsonResponse({ ok: false, error: 'Invalid JSON body', code: 'BAD_REQUEST' });
    }

    if (!req.secret || req.secret !== SHARED_SECRET) {
      Logger.log('Rejected: bad secret');
      return jsonResponse({ ok: false, error: 'Unauthorized', code: 'BAD_SECRET' });
    }

    if (!req.url) {
      return jsonResponse({ ok: false, error: 'Missing field: url', code: 'BAD_REQUEST' });
    }

    var formData = {
      url:         req.url,
      mode:        req.mode || 'create',
      reviewer:    req.reviewer || 'Initial Upload',
      publishDate: '',
      oldUrl:      req.oldUrl || '',
    };

    var result;
    try {
      result = refreshArticle(formData);
    } catch (rfErr) {
      var parsed;
      try { parsed = JSON.parse(rfErr.message); } catch (pe) { parsed = null; }
      if (parsed && parsed.code) {
        return jsonResponse({
          ok: false,
          code: parsed.code,
          error: parsed.message || rfErr.message,
          existingDocTitle: parsed.existingDocTitle || '',
          existingDocUrl:   parsed.existingDocUrl || '',
          matchedBy:        parsed.matchedBy || '',
        });
      }
      return jsonResponse({ ok: false, code: 'REFRESH_ERROR', error: rfErr.message });
    }

    return jsonResponse({
      ok: true,
      mode: result.mode,
      docUrl: result.docUrl,
      docTitle: result.docTitle,
      docFilename: result.docFilename,
      matchedBy: result.matchedBy || '',
      issues: result.issues || [],
    });

  } catch (err) {
    Logger.log('INTERNAL ERROR: ' + err + '\n' + (err.stack || ''));
    return jsonResponse({ ok: false, error: 'Internal error: ' + err.message, code: 'INTERNAL' });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}