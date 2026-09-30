import { readFile, writeFile } from 'node:fs/promises';
const data = JSON.parse(
  await readFile(
    new URL('../public/chronochasm/content.json', import.meta.url),
    'utf8',
  ),
);
const escape = (text) =>
  String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const output = [
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Chronochasm · Plain record</title><link rel="stylesheet" href="/chronochasm/record.css"></head><body><main><a href="/chronochasm">← Chronochasm</a><h1>The selected record</h1><p>A plain reading companion to the selected record.</p>',
];
for (const moment of data.moments) {
  output.push(
    `<article id="${escape(moment.id)}"><p class="eyebrow">${escape(moment.date)}</p><h2>${escape(moment.title)}</h2><p>${escape(moment.deck)}</p>`,
  );
  for (const paragraph of moment.paragraphs)
    output.push(`<p>${escape(paragraph)}</p>`);
  output.push('<details><summary>Selected sources</summary>');
  for (const id of moment.sources) {
    const source = data.sources[id];
    output.push(
      `<h3>${escape(source.reference)}</h3><p>${escape(source.context || '')}</p>`,
    );
    for (const selection of source.detail?.selections || [])
      output.push(
        `<blockquote><strong>${escape(selection.speaker)}</strong><p>${escape(selection.text)}</p></blockquote>`,
      );
    if (!source.detail)
      output.push(`<blockquote>${escape(source.excerpt || '')}</blockquote>`);
  }
  output.push('</details></article>');
}
output.push(
  '<p>AI-assisted reconstruction from selected records. This plain companion retains published paragraphs and selected source words; use the <a href="https://probablyfine.dev/chronochasm">published reader</a> for the full editorial presentation.</p></main></body></html>',
);
await writeFile(
  new URL('../public/chronochasm/record.html', import.meta.url),
  output.join(''),
);
