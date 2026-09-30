import test from 'node:test';
import assert from 'node:assert/strict';
import { createPathStore } from '../public/chronochasm/path-store.js';
const data = {
  moments: [{ id: 'one' }, { id: 'two' }],
  sources: { source: {} },
};
const key = 'max-chronochasm-path:v1';
function fixture(seed) {
  const values = new Map(seed);
  const warnings = [];
  const storage = {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
  };
  return {
    values,
    warnings,
    storage,
    state: createPathStore(data, storage, (text) => warnings.push(text)),
  };
}
test('Exploration stays in memory until opted in; validated ids and duplicates are bounded', () => {
  const f = fixture();
  f.state.open('one');
  f.state.open('one');
  f.state.open('invented');
  f.state.source('source');
  assert.equal(f.values.size, 0);
  assert.deepEqual(f.state.state.moments, ['one']);
  f.state.remember(true);
  const recovered = createPathStore(data, f.storage, () => {});
  assert.equal(recovered.remembering, true);
  assert.deepEqual(recovered.state, f.state.state);
});
test('Malformed records are preserved and cannot be silently overwritten', () => {
  const f = fixture([[key, '{broken']]);
  f.state.open('one');
  f.state.remember(true);
  assert.equal(f.values.get(key), '{broken');
  assert.equal(f.state.remembering, false);
  f.state.clear();
  f.state.open('two');
  f.state.remember(true);
  assert.equal(JSON.parse(f.values.get(key)).last, 'two');
});
test('Unknown ids in stored state are rejected before use', () => {
  const f = fixture([
    [
      key,
      JSON.stringify({
        version: 1,
        moments: ['unknown'],
        sources: [],
        last: 'unknown',
      }),
    ],
  ]);
  assert.deepEqual(f.state.state.moments, []);
  assert.equal(f.state.remembering, false);
});
test('Quota failure retains current in-memory progress and reports older persisted state', () => {
  const f = fixture();
  f.state.open('one');
  f.state.remember(true);
  f.storage.setItem = () => {
    throw Error('quota');
  };
  f.state.open('two');
  assert.equal(f.state.state.last, 'two');
  assert.equal(JSON.parse(f.values.get(key)).last, 'one');
  assert.ok(f.warnings.at(-1).includes('earlier saved path may remain'));
});
test('Forget and opt-out remove only the path key; blocked deletion is reported honestly', () => {
  const f = fixture([['another-key', 'keep']]);
  f.state.open('one');
  f.state.remember(true);
  f.state.remember(false);
  assert.equal(f.values.has(key), false);
  assert.equal(f.values.get('another-key'), 'keep');
  f.state.remember(true);
  f.storage.removeItem = () => {
    throw Error('denied');
  };
  f.state.clear();
  assert.equal(f.state.remembering, true);
  assert.ok(f.warnings.at(-1).includes('could not be removed'));
});
