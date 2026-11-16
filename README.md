# Content Index Tools

Contentful -> HC Auto Sync / HC Sync -> HC Docs
Salesforce -> KA Sync v2 -> KA Docs
HC + KA Docs -> Content Audit Bridge (CorpusSync) -> Corpus Cache sheet -> corpus_full.json -> auditor skill
Corpus sheet glossary_auto + glossary_extra -> GlossaryDoc -> public glossary Doc + Sheet (daily)

Folders in apps-script/ = one Apps Script project each.
Edit code HERE, not in the Apps Script editor: every push to main copies it to Apps Script.

## Spanish glossary

- Source: `glossary_auto` tab of the corpus sheet (edited through the Localization Auditor app).
- Extra per-term info: `glossary_extra` tab (app label, variations, do not use, English context).
- `apps-script/content-audit-bridge/GlossaryDoc.js` publishes the public Doc and Sheet every day (only when something changed) and lists new UI labels to approve every Monday in the `glossary_ui_candidates` tab.
- `GlossaryData.js` is the record of the Nov 16, 2026 review (449 terms), loaded once with `applyFinalGlossary()`.
- Public Doc: https://docs.google.com/document/d/13Q6onYfCxvX6WxzefPAkS1oionvqWCdB5Q5HxPqRa7k/edit
- Public Sheet: https://docs.google.com/spreadsheets/d/17X5Ss5ZAyu9t_4FkBS5LV51vF7uy6Syvru59EELt19A/edit
- Don't edit the Doc or the Sheet by hand: they are rewritten from the corpus sheet.
