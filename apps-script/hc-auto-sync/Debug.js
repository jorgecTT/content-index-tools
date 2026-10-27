function debugNodeTypes() {
  var a = fetchArticleFromContentful('thumbtack-phone-numbers-on-direct-leads');
  if (!a) { Logger.log('No se encontró el artículo'); return; }
  function walk(nodes, depth) {
    (nodes || []).forEach(function(n) {
      var extra = '';
      if (n.nodeType === 'embedded-entry-block' || n.nodeType === 'embedded-entry-inline') {
        var e = a.includes.entries[n.data.target.sys.id];
        extra = e ? ' -> entry type: ' + e.sys.contentType.sys.id + ' | fields: ' + Object.keys(e.fields).join(', ') : ' -> (no incluido)';
        Logger.log(new Array(depth + 1).join('  ') + n.nodeType + extra);
        if (e && e.fields.content) walk(e.fields.content.content, depth + 1);
        if (e && e.fields.toggleSegments) {
          e.fields.toggleSegments.forEach(function(s) {
            var seg = a.includes.entries[s.sys.id];
            if (seg) {
              Logger.log(new Array(depth + 2).join('  ') + 'segment: ' + (seg.fields.title || '') + ' | fields: ' + Object.keys(seg.fields).join(', '));
              if (seg.fields.content) walk(seg.fields.content.content, depth + 2);
            }
          });
        }
        return;
      }
      if (n.nodeType === 'hyperlink') extra = ' -> ' + n.data.uri;
      if (n.nodeType === 'entry-hyperlink') extra = ' -> entry ' + n.data.target.sys.id;
      if (n.nodeType === 'text') extra = ' "' + (n.value || '').slice(0, 40) + '"';
      Logger.log(new Array(depth + 1).join('  ') + n.nodeType + extra);
      if (n.content) walk(n.content, depth + 1);
    });
  }
  walk(a.item.fields.bodyText.content, 0);
}
function debugTableAndLinks() {
  var a = fetchArticleFromContentful('thumbtack-phone-numbers-on-direct-leads');

  // 1. La tabla
  Object.keys(a.includes.entries).forEach(function(id) {
    var e = a.includes.entries[id];
    if (e.sys.contentType.sys.id === 'table') {
      Logger.log('TABLE ' + id + ' | name: ' + e.fields.name);
      Logger.log(JSON.stringify(e.fields.table).slice(0, 3000));
    }
  });

  // 2. Los entry-hyperlink
  var ids = ['td6S1jrNNkcv6PgHcaH6R', '1kTeoJ9ReNbWPNwus1S3aH',
             '2TeFMk8K0z0vmrpCcAZ2Kt', '5td464Ro7GLO1edVgAVJZK'];
  ids.forEach(function(id) {
    var e = a.includes.entries[id];
    if (!e) { Logger.log('LINK ' + id + ' -> NO viene en includes'); return; }
    Logger.log('LINK ' + id + ' -> type: ' + e.sys.contentType.sys.id +
      ' | slug: ' + (e.fields.slug || '-') +
      ' | title: ' + (e.fields.title || e.fields.name || '-') +
      ' | fields: ' + Object.keys(e.fields).join(', '));
  });
}

function testTTNumbers() {
  Logger.log(JSON.stringify(syncSingleArticle(
    'https://help.thumbtack.com/article/thumbtack-phone-numbers-on-direct-leads')));
}