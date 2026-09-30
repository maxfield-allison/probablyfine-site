import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlaces,
  validPlace,
  PLACE_PREFIX,
} from '../public/js/reading-places.js';
const one = {
  version: 1,
  path: '/blog/one',
  title: 'One',
  heading: 'the-start',
};
function store() {
  const values = new Map();
  return {
    values,
    get length() {
      return values.size;
    },
    key: (i) => [...values.keys()][i],
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
  };
}
test('Only explicit saves write, and separate tabs preserve separate pages', () => {
  const s = store(),
    a = createPlaces(s),
    b = createPlaces(s);
  a.read();
  assert.equal(s.length, 0);
  a.save(one);
  b.save({ ...one, path: '/projects/two' });
  assert.equal(a.read().length, 2);
});
test('Untrusted destinations and malformed entries never become return links', () => {
  for (const path of [
    '//evil.test',
    'https://evil.test',
    '/blog/../admin',
    '/blog/one?token=x',
  ])
    assert.equal(validPlace({ ...one, path }), false);
  const s = store();
  s.setItem(PLACE_PREFIX + '/blog/one', 'broken');
  assert.deepEqual(createPlaces(s).read(), []);
  assert.equal(s.length, 1);
});
test('Quota failure retains current edits without hiding other saved pages', () => {
  const s = store();
  const a = createPlaces(s);
  a.save(one);
  s.setItem = () => {
    throw Error('quota');
  };
  assert.equal(a.save({ ...one, path: '/blog/two' }), false);
  assert.equal(a.read().length, 2);
});
test('Clear is scoped and failure is reported instead of claimed as success', () => {
  const s = store();
  s.setItem('unrelated', 'keep');
  const warnings = [],
    a = createPlaces(s, (m) => warnings.push(m));
  a.save(one);
  assert.equal(a.clear(), true);
  assert.equal(s.getItem('unrelated'), 'keep');
  a.save(one);
  s.removeItem = () => {
    throw Error('denied');
  };
  assert.equal(a.clear(), false);
  assert.ok(warnings.at(-1).includes('could not be removed'));
});
