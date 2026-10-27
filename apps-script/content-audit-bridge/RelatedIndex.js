/**
 * ================================================================
 * Content Audit — Related Index  (NEW FILE: RelatedIndex.gs)
 * v1.0.0
 * ================================================================
 * Lives in the SAME Apps Script project as CorpusSync.gs, WebApp.gs,
 * LocalizationTracker.gs, UrlIndex.gs, SlugAliases.gs, KaUrlIndex.gs.
 * Reuses COLUMNS, getSheet_, CORPUS_SHEET_ID_LITERAL (CorpusSync.gs)
 * and normalize_, tokenize_, STOPWORDS (WebApp.gs) — do not redeclare.
 *
 * WHAT IT DOES:
 *   Builds a 'related_index' tab: for every ACTIVE ENGLISH article
 *   (HC and KA lanes), its TOP 10 most related articles across BOTH
 *   lanes — so a skill can jump straight from any article to the
 *   handful that share its topic (e.g. an HC refund-policy article
 *   ↔ the KAs whose sections cover refunds) without reading the
 *   whole corpus.
 *
 * SCOPE — EN ONLY, by design:
 *   ES/PT siblings are resolved separately via url_index; including
 *   them here would just duplicate every relation with noise.
 *
 * MATCHING (pure Apps Script, no AI, light columns only — NEVER
 * fullText):
 *   Each article's tokens come from title (weight 3), headings
 *   (weight 2) and concepts (weight 2, used only where populated).
 *   Pair score = sum of min(weightA, weightB) over shared tokens.
 *   Pairs below MIN score are dropped; each article keeps its top 10.
 *   The 'matchedOn' column says which fields drove the match, so the
 *   skill can weigh confidence.
 *
 * SAFETY:
 *   - WRITES ONLY to the 'related_index' tab. One setValues() write.
 *   - Relations are stored in BOTH directions (A->B and B->A) so a
 *     single filter by docId returns everything.
 *
 * SCHEMA (related_index):
 *   docId | title | lane | relatedDocId | relatedTitle | relatedLane |
 *   score | matchedOn
 *
 * SETUP:
 *   1) buildRelatedIndex()          -> builds the tab (~1-2 min)
 *   2) installRelatedIndexTrigger() -> nightly rebuild ~6 AM
 * ================================================================ */

var RELINDEX_TAB_NAME = 'related_index';

var RELINDEX_COLUMNS = [
  'docId', 'title', 'lane', 'relatedDocId', 'relatedTitle', 'relatedLane',
  'score', 'matchedOn'
];

// Keep the strongest N relations per article.
var RELINDEX_TOP_N = 10;

// Minimum pair score to be considered related at all.
// 6 = two shared title words, or one title word + mixed support.
var RELINDEX_MIN_SCORE = 6;

// Field weights (title > headings = concepts).
var RELINDEX_W_TITLE = 3;
var RELINDEX_W_HEADINGS = 2;
var RELINDEX_W_CONCEPTS = 2;


/* ================================================================
 * MAIN — build (or rebuild) the related_index tab.
 * ================================================================ */
function buildRelatedIndex() {
  var ss = SpreadsheetApp.openById(CORPUS_SHEET_ID_LITERAL);
  var corpus = getSheet_();

  // ---- 1) READ light columns (never fullText) ----
  var n = corpus.getLastRow() - 1;
  if (n < 1) { Logger.log('Corpus vacío, nada que hacer.'); return; }

  var col = function (name) { return COLUMNS.indexOf(name) + 1; };
  var docIds     = corpus.getRange(2, col('docId'),     n, 1).getValues();
  var titles     = corpus.getRange(2, col('title'),     n, 1).getValues();
  var lanes      = corpus.getRange(2, col('lane'),      n, 1).getValues();
  var languages  = corpus.getRange(2, col('language'),  n, 1).getValues();
  var lifecycles = corpus.getRange(2, col('lifecycle'), n, 1).getValues();
  var headingsC  = corpus.getRange(2, col('headings'),  n, 1).getValues();
  var conceptsC  = corpus.getRange(2, col('concepts'),  n, 1).getValues();

  // ---- 2) COLLECT active EN docs (both lanes) + token maps ----
  var docs = [];
  var withConcepts = 0;

  for (var r = 0; r < n; r++) {
    var lang = String(languages[r][0] || '').toUpperCase();
    if (lang !== 'EN') continue;

    var lifecycle = String(lifecycles[r][0] || 'active').toLowerCase();
    if (lifecycle !== 'active') continue;

    var lane = String(lanes[r][0] || '').toUpperCase();
    if (lane !== 'HC' && lane !== 'KA') continue;

    var docId = String(docIds[r][0] || '').trim();
    if (!docId) continue;

    var title = String(titles[r][0] || '');
    var headings = String(headingsC[r][0] || '');
    var concepts = String(conceptsC[r][0] || '');
    if (concepts.trim()) withConcepts++;

    // token -> { w: weight, f: field bitmask (1=title, 2=headings, 4=concepts) }
    var tokens = {};
    var addTokens = function (text, weight, flag) {
      tokenize_(normalize_(text)).forEach(function (t) {
        if (!tokens[t]) tokens[t] = { w: 0, f: 0 };
        if (weight > tokens[t].w) tokens[t].w = weight;
        tokens[t].f = tokens[t].f | flag;
      });
    };
    addTokens(title, RELINDEX_W_TITLE, 1);
    addTokens(headings, RELINDEX_W_HEADINGS, 2);
    addTokens(concepts, RELINDEX_W_CONCEPTS, 4);

    docs.push({ docId: docId, title: title, lane: lane,
                tokens: tokens, tokenList: Object.keys(tokens) });
  }

  if (docs.length === 0) {
    Logger.log('No active EN docs found. Nothing to index.');
    return;
  }

  // ---- 3) SCORE every pair (in memory) ----
  // For each doc keep a running top-N (small arrays, cheap).
  var tops = docs.map(function () { return []; });

  function pushTop(list, item) {
    list.push(item);
    list.sort(function (a, b) { return b.score - a.score; });
    if (list.length > RELINDEX_TOP_N) list.pop();
  }

  for (var i = 0; i < docs.length; i++) {
    var A = docs[i];
    for (var j = i + 1; j < docs.length; j++) {
      var B = docs[j];

      // Iterate over the smaller token list.
      var small = (A.tokenList.length <= B.tokenList.length) ? A : B;
      var big   = (small === A) ? B : A;

      var score = 0;
      var fields = 0;
      for (var k = 0; k < small.tokenList.length; k++) {
        var tok = small.tokenList[k];
        var tb = big.tokens[tok];
        if (!tb) continue;
        var ta = small.tokens[tok];
        score += Math.min(ta.w, tb.w);
        fields = fields | ta.f | tb.f;
      }

      if (score < RELINDEX_MIN_SCORE) continue;

      var matchedOn = [];
      if (fields & 1) matchedOn.push('title');
      if (fields & 2) matchedOn.push('headings');
      if (fields & 4) matchedOn.push('concepts');
      var matchedStr = matchedOn.join('+');

      pushTop(tops[i], { d: j, score: score, matchedOn: matchedStr });
      pushTop(tops[j], { d: i, score: score, matchedOn: matchedStr });
    }
  }

  // ---- 4) BUILD rows (both directions already handled above) ----
  var rows = [];
  var crossLane = 0;
  for (var x = 0; x < docs.length; x++) {
    var src = docs[x];
    tops[x].forEach(function (rel) {
      var dst = docs[rel.d];
      if (src.lane !== dst.lane) crossLane++;
      rows.push([src.docId, src.title, src.lane,
                 dst.docId, dst.title, dst.lane,
                 rel.score, rel.matchedOn]);
    });
  }

  // ---- 5) ONE write ----
  var sh = ss.getSheetByName(RELINDEX_TAB_NAME);
  if (!sh) sh = ss.insertSheet(RELINDEX_TAB_NAME);
  sh.clearContents();
  sh.getRange(1, 1, 1, RELINDEX_COLUMNS.length).setValues([RELINDEX_COLUMNS]);
  sh.setFrozenRows(1);
  if (rows.length) {
    sh.getRange(2, 1, rows.length, RELINDEX_COLUMNS.length).setValues(rows);
  }

  Logger.log('Related Index rebuilt — ' + rows.length + ' relations for ' + docs.length + ' EN docs.');
  Logger.log('  cross-lane relations (HC<->KA): ' + crossLane +
             ' | concepts coverage: ' + withConcepts + '/' + docs.length + ' docs');
  if (withConcepts < docs.length * 0.5) {
    Logger.log('  NOTE: concepts is sparsely populated — matching relies mostly on title+headings.');
    Logger.log('  Running an enrich batch (mode=enrich) will improve this index on the next rebuild.');
  }
}


/* ================================================================
 * ONE-TIME — nightly rebuild ~6 AM (after the corpus sync at ~5 AM).
 * ================================================================ */
function installRelatedIndexTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'buildRelatedIndex') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('buildRelatedIndex')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();
  Logger.log('Related Index nightly trigger installed (~6 AM daily).');
}