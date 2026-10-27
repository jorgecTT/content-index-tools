/**
 * Linear Linkifier for Google Docs
 * ---------------------------------
 * Cleans up Linear issue links in a Google Doc: replaces the long URL text
 * with a tidy "ID: title" label (e.g. "CON-316: phone call support ...")
 * while keeping the original URL as the hyperlink.
 *
 * Google usually auto-hyperlinks a pasted Linear URL, but leaves the full
 * ugly URL as the visible text. This shortens that text in place. It works
 * whether or not the URL is already linked.
 *
 * The title is derived from the URL slug, so it's lowercase and loses the
 * original punctuation — but it's readable and needs no setup.
 *
 * Setup: Extensions → Apps Script → paste this file → Save → reload the doc.
 * Then use the "Linear Links" menu → "Clean up Linear links".
 */

// Matches Linear issue URLs, e.g.
//   https://linear.app/acme/issue/ENG-123/some-issue-slug
//   https://linear.app/acme/issue/ENG-123
// Capture group 1 = the issue identifier (ENG-123).
// Capture group 2 = the title slug ("some-issue-slug"), if present.
var LINEAR_URL_RE =
  /https?:\/\/linear\.app\/[^\/\s]+\/issue\/([A-Z0-9]+-\d+)(?:\/([^\s)\]]*))?/g;

function onOpen() {
  DocumentApp.getUi()
    .createMenu('Linear Links')
    .addItem('Clean up Linear links', 'cleanUpLinearLinks')
    .addToUi();
}

/** Public: shorten every Linear issue URL to "ID: title", keeping the link. */
function cleanUpLinearLinks() {
  var doc = DocumentApp.getActiveDocument();
  var sections = [doc.getBody()];

  var header = doc.getHeader();
  var footer = doc.getFooter();
  if (header) sections.push(header);
  if (footer) sections.push(footer);
  doc.getFootnotes().forEach(function (fn) { sections.push(fn.getFootnoteContents()); });

  var count = 0;
  sections.forEach(function (section) {
    count += processContainer_(section);
  });

  var msg = count === 1
    ? '1 Linear link cleaned up.'
    : count + ' Linear links cleaned up.';
  DocumentApp.getUi().alert(msg);
}

/** Recursively process a container element, editing Text runs in place. */
function processContainer_(element) {
  var count = 0;
  if (element.getType() === DocumentApp.ElementType.TEXT) {
    count += processTextElement_(element.asText());
  } else if (element.getNumChildren) {
    for (var i = 0; i < element.getNumChildren(); i++) {
      count += processContainer_(element.getChild(i));
    }
  }
  return count;
}

/**
 * Find Linear issue URLs within a single Text element and replace each with
 * a clean "ID: title" label linked to the original URL. Matches are applied
 * from right to left so text replacements don't shift earlier offsets.
 */
function processTextElement_(text) {
  var raw = text.getText();
  if (raw.indexOf('linear.app') === -1) return 0;

  LINEAR_URL_RE.lastIndex = 0;
  var matches = [];
  var m;
  while ((m = LINEAR_URL_RE.exec(raw)) !== null) {
    matches.push({
      start: m.index,
      end: m.index + m[0].length - 1, // inclusive end offset
      url: m[0],
      id: m[1],
      slug: m[2]
    });
  }

  for (var i = matches.length - 1; i >= 0; i--) {
    var mm = matches[i];
    var display = buildDisplayText_(mm.id, mm.slug);
    text.deleteText(mm.start, mm.end);
    text.insertText(mm.start, display);
    text.setLinkUrl(mm.start, mm.start + display.length - 1, mm.url);
  }
  return matches.length;
}

/**
 * Build the clean display text from an issue id and (optional) URL slug.
 *   ("CON-316", "phone-call-support-...-routing")
 *     -> "CON-316: phone call support ... routing"
 * With no slug, returns just the id.
 */
function buildDisplayText_(id, slug) {
  var title = titleFromSlug_(slug);
  return title ? id + ': ' + title : id;
}

/**
 * Convert a URL slug into a readable, lowercase title.
 * Hyphens/underscores become spaces; the text is left lowercase.
 */
function titleFromSlug_(slug) {
  if (!slug) return '';
  var s;
  try {
    s = decodeURIComponent(slug); // handle any %20 etc.
  } catch (e) {
    s = slug;
  }
  return s.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

