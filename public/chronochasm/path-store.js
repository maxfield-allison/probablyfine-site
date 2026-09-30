const KEY = 'max-chronochasm-path:v1';
export function createPathStore(data, storage, report) {
  const moments = new Set(data.moments.map((m) => m.id));
  const sources = new Set(Object.keys(data.sources));
  let state = { version: 1, moments: [], sources: [], last: null };
  let remembering = false;
  let blocked = false;
  const valid = (value) =>
    value?.version === 1 &&
    Array.isArray(value.moments) &&
    value.moments.length <= moments.size &&
    value.moments.every((id) => moments.has(id)) &&
    new Set(value.moments).size === value.moments.length &&
    Array.isArray(value.sources) &&
    value.sources.length <= sources.size &&
    value.sources.every((id) => sources.has(id)) &&
    new Set(value.sources).size === value.sources.length &&
    (value.last === null || value.moments.includes(value.last));
  try {
    const raw = storage.getItem(KEY);
    if (raw !== null) {
      const saved = JSON.parse(raw);
      if (!valid(saved)) throw Error('Invalid saved path');
      state = saved;
      remembering = true;
    }
  } catch {
    blocked = true;
    report(
      'Your saved path could not be loaded. This visit is temporary; clear the path before saving a new one.',
    );
  }
  function save() {
    if (!remembering) return;
    try {
      storage.setItem(KEY, JSON.stringify(state));
      report('Your path is saved on this browser at this address.');
    } catch {
      report(
        'This change could not be saved. Your earlier saved path may remain; current changes are temporary.',
      );
    }
  }
  return {
    get state() {
      return structuredClone(state);
    },
    get remembering() {
      return remembering;
    },
    open(id) {
      if (!moments.has(id)) return;
      if (!state.moments.includes(id)) state.moments.push(id);
      state.last = id;
      save();
    },
    source(id) {
      if (!sources.has(id)) return;
      if (!state.sources.includes(id)) state.sources.push(id);
      save();
    },
    remember(value) {
      if (value) {
        if (blocked) {
          report(
            'Clear the unavailable or invalid saved path before saving a new one.',
          );
          return;
        }
        remembering = true;
        save();
      } else {
        try {
          storage.removeItem(KEY);
          remembering = false;
          report('Remembering is off. This visit stays temporary.');
        } catch {
          report(
            'The saved path could not be removed. Browser storage settings can clear it.',
          );
        }
      }
    },
    clear() {
      try {
        storage.removeItem(KEY);
        remembering = false;
        blocked = false;
        state = { version: 1, moments: [], sources: [], last: null };
        report('Your path has been cleared.');
      } catch {
        report(
          'The saved path could not be removed. Browser storage settings can clear it.',
        );
      }
    },
  };
}
