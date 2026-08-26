// Fail the build when a published post has no process note.
//
// /ai says: "Every post also carries a note at the bottom describing what
// happened to that particular piece, and the note is the real disclosure."
// That was enforced by remembering, and remembering failed twice. The v1.0
// policy commit's own message said it had added the notes to every post when
// it had written exactly one, and the gap survived eight days and one launch
// before anyone noticed. See brain#60.
//
// So the promise is a build gate now. A post that is published (draft is not
// true) must contain a paragraph opening with the bolded lead-in.
//
// The exact string matters beyond style. public/js/post-signals.js finds the
// note by looking for a `p > strong` whose text starts with "how this one was
// made" and fires the note-read counter off it. A note written any other way
// is invisible to the measurement the policy's whole bet rests on, so this
// checks for the form the tracker can see rather than for a note in spirit.
//
// Drafts are exempt: the note is written from what actually happened to the
// piece, which is not knowable until the editing is done. Runs from prebuild.

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src/content/posts');

const LEAD = '**How this one was made.**';

const problems = [];
let checked = 0;

for (const name of readdirSync(dir).sort()) {
  if (!/\.mdx?$/.test(name)) continue;

  const text = readFileSync(join(dir, name), 'utf8');
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) {
    problems.push(`${name}: no frontmatter`);
    continue;
  }
  if (/^draft:\s*true\s*$/m.test(fm[1])) continue;

  checked++;

  // Must open a paragraph, or it renders inside another <p> and the tracker
  // never sees it.
  const body = text.slice(fm[0].length);
  const opensParagraph = body
    .split('\n\n')
    .some((block) => block.trimStart().startsWith(LEAD));

  if (!opensParagraph) {
    problems.push(
      body.includes(LEAD)
        ? `${name}: the note does not start its own paragraph, so post-signals.js cannot see it`
        : `${name}: published with no "${LEAD}" note`
    );
  }
}

if (problems.length) {
  console.error('The AI policy promises a process note on every published post:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    `\nAdd a paragraph beginning "${LEAD}" at the foot of the post, saying what` +
      '\nactually happened to that piece. Source it from the working session or the git' +
      '\nrecord; where the record is thin the note says less rather than inventing process.'
  );
  process.exit(1);
}

console.log(`ai notes: ${checked} published post(s) carry a process note`);
