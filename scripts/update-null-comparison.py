#!/usr/bin/env python3
"""Regenerate exact diffs after editing the revised article; preserve the guide."""
import argparse
import difflib
from pathlib import Path
import re

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1] / 'src/content/article-versions/null'
comparison = root / 'version-comparison.md'
current = comparison.read_text()
marker = '## Exact text changes\n'
assert current.count(marker) == 1, 'Comparison must contain one exact-diff section'
result = current.split(marker)[0] + marker + '\n'
result += ('These diffs compare the original dictation with the first edited draft, then that draft '
           'with the current revised article. They show changes between the three retained stages, '
           'not every intermediate editing exchange. Draft front matter is omitted. Each long line '
           'is one paragraph; a minus line is removed text and a plus line is added text.\n\n')

def body(name):
    return re.sub(r'^---\n.*?\n---\n', '', (root / name).read_text(), count=1, flags=re.S).strip()

for before, after, label in [
    ('original-dictation.md', 'draft.md', 'Original dictation → edited draft'),
    ('draft.md', 'assisted-researched.md', 'Edited draft → revised article'),
]:
    diff = '\n'.join(difflib.unified_diff(body(before).splitlines(), body(after).splitlines(),
                                       fromfile=before, tofile=after, n=0, lineterm=''))
    result += f'<details>\n<summary>{label}</summary>\n\n```diff\n{diff}\n```\n\n</details>\n\n'
result = result.rstrip() + '\n'
if args.check:
    if current != result:
        raise SystemExit('Comparison diffs are stale: run python3 scripts/update-null-comparison.py')
    print('PASS: both comparison diffs match the three current documents')
else:
    comparison.write_text(result)
    print('Updated both exact comparison diffs; review the prose guide and passage notes separately')
