import original from '../content/article-versions/null/original-dictation.md?raw';
import edited from '../content/article-versions/null/draft.md?raw';
import researched from '../content/article-versions/null/assisted-researched.md?raw';
import comparison from '../content/article-versions/null/version-comparison.md?raw';
import post from '../content/posts/why-i-created-null.md?raw';

export const nullSlug = 'why-i-created-null';
export const versions = [
  { id: 'original', label: 'Original dictation', file: 'original-dictation', text: original },
  { id: 'edited', label: 'Edited draft', file: 'draft', text: edited },
  { id: 'researched', label: 'Revised article', file: 'assisted-researched', text: researched },
] as const;
export const documents = [
  ...versions,
  { id: 'comparison', label: 'Version comparison', file: 'version-comparison', text: comparison },
];
export const withoutFrontmatter = (text: string) => text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();

// The page-level disclosure stays visible across versions. Historical snapshots
// keep their original notes; the canonical post owns this current disclosure.
export const pageProcessNote = post.trim().split(/\n\s*\n/).at(-1)!;
if (!pageProcessNote.startsWith('**How this one was made.**')) {
  throw new Error('The null article must end with its page-level AI-use note');
}

// Ordered editorial alignment, not fuzzy matching at runtime. Each boundary
// consumes the next paragraphs of all three snapshots exactly once. Related
// paragraphs stay together where an edit reordered ideas within a passage.
const alignment = [
  ['beginning', 1, 1, 1],
  ['software', 2, 2, 2],
  ['harness', 3, 3, 3],
  ['activity', 4, 4, 4],
  ['iteration', 5, 5, 5],
  ['research-habit', 6, 6, 6],
  ['conversation', 7, 9, 9],
  ['concerns', 8, 11, 11],
  ['argument-and-definition', 11, 13, 13],
  ['it-depends', 12, 16, 17],
  ['learning-studies', 13, 19, 20],
  ['shower-and-context', 15, 21, 22],
  ['other-inputs', 16, 23, 24],
  ['possibilities', 17, 24, 25],
  ['unknowns', 18, 25, 26],
  ['human-influence', 19, 30, 32],
  ['null', 20, 33, 35],
  ['first-use', 21, 34, 36],
  ['evidence-limits', 22, 35, 37],
  ['sharing', 23, 37, 39],
  ['hopes', 24, 38, 40],
  ['sources', 25, 40, 41],
  ['process-note', 25, 41, 42],
] as const;

// Passage-level guide to the full comparison document. These are editorial
// descriptions, displayed outside the article rather than added to its prose.
const changeNotes = [
  'The edited draft condenses the opening and normalizes names. The revised article adds an early description of null, following the author-requested critique and editing pass.',
  'The edited draft includes my later correction: turning ideas into engineered software for the broader problem domain, not only individual fixes. The revised article preserves it.',
  'The edited draft clarifies the harness description. The revised article corrects the engineering-assurance terminology to its prebuild and prerelease phases.',
  'My later correction adds the past several months as the period covered by the GitLab activity description. Both drafts retain it as my personal account.',
  'The edited draft condenses the description of the harness becoming a project of its own. The revised article retains it.',
  'Repetition and dictation grammar are edited. The research habit and uncertainty remain my account.',
  'The edited draft condenses the conversation and Dota 2 aside. The revised article removes the aside about technical knowledge. The experience remains the author’s account.',
  'The draft removes repeated dictation. The revised article adds the distinction raised in the AI critique: controlling unsolicited contributions does not settle the concern about time spent. It does not establish a diagnosis or clinical causation.',
  'The edited draft softens categorical claims. Following the AI critique, the revised article removes the lazy-versus-deep-thinker contrast, preserves the author’s account of his reasoning, and states that it is not evidence of personal protection. The technical explanation and earlier-post link are assistant additions.',
  'The edited draft separates the questions and conclusion. The revised article records my request to check the studies I had read and fill in references.',
  'The revised article replaces the placeholders with the math and colonoscopy studies, measured outcomes, and limits. It distinguishes assisted practice from unaided performance and observation from causation.',
  'The revised article qualifies context poisoning as an informal description and removes the unverified last-night chronology. The shower thought remains the author’s account; no replacement date is invented.',
  'The edited draft distinguishes training from the text supplied in the current interaction. The revised article preserves that distinction.',
  'The solution A/B example remains. The revised article adds sycophancy research as a related example, not proof of that particular omitted-option scenario.',
  'The wording is tightened while retaining the value I place on finding unknown unknowns and judging the results myself.',
  'The draft turns the human-context analogy into questions. The revised article identifies it as an analogy, supplies the feedback and persuasion studies, includes beneficial feedback, and accounts for the persuasion paper’s correction.',
  'The revised article describes the public skill’s requested behavior and adds the critique’s tradeoff: requested output can still influence a person, and silence can withhold useful suggestions. It removes an assistant-invented first-person thought. Whether null helps remains a hypothesis.',
  'The revised article identifies Codex, dates the first-use account to September 23, removes the incorrect yesterday claim and an assistant-invented first-person sentence, and records the later request for critique after null was turned off.',
  'The revised article adds the repository’s reported test scope and distinguishes instruction-following checks from evidence of cognitive benefit.',
  'The revised article describes sharing the article as an intention. The skill was public; the article remained a draft. The X.com sentence is retained.',
  'The revised article asks for concrete usability reports. This is an AI-suggested refinement from the requested critique; it does not supply effectiveness evidence.',
  'The revised article replaces placeholders with public study and project links. Private research notes are not presented as published sources.',
  'The revised article’s note describes several exchanges, the author’s corrections and decision to request another editing pass, and Codex’s writing and implementation. It is displayed once below the comparison and included in the revised download.',
];

export function alignedPassages() {
  const paragraphs = versions.map(({ text }) => withoutFrontmatter(text).split(/\n\s*\n/));
  const cursors = [0, 0, 0];
  const rows = alignment.map(([id, ...ends], index) => ({
    id,
    note: changeNotes[index],
    cells: versions.map((version, i) => {
      const end = ends[i];
      if (end < cursors[i] || end > paragraphs[i].length) throw new Error(`Invalid ${version.id} alignment: ${id}`);
      const markdown = paragraphs[i].slice(cursors[i], end).join('\n\n');
      cursors[i] = end;
      return { version: version.id, markdown };
    }),
  }));
  paragraphs.forEach((parts, i) => {
    if (cursors[i] !== parts.length) throw new Error(`Unaligned ${versions[i].id} paragraphs; update the passage map`);
  });
  return rows;
}
