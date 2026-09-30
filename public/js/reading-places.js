// Deliberate bookmarks only. One key per page keeps separate tabs independent.
export const PLACE_PREFIX = 'pf-reading-place:v1:';
const pagePath = /^\/(?:blog|projects|notes)\/[a-z0-9-]+$/;
export function validPlace(value) {
  return (
    value?.version === 1 &&
    typeof value.path === 'string' &&
    pagePath.test(value.path) &&
    typeof value.title === 'string' &&
    value.title.length > 0 &&
    value.title.length <= 180 &&
    typeof value.heading === 'string' &&
    value.heading.length <= 256 &&
    !/[\u0000-\u001f]/.test(value.heading)
  );
}
export function createPlaces(storage, report = () => {}) {
  const temporary = new Map();
  function read() {
    const found = new Map();
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key?.startsWith(PLACE_PREFIX)) continue;
        try {
          const value = JSON.parse(storage.getItem(key));
          if (!validPlace(value) || key !== PLACE_PREFIX + value.path)
            throw Error('Invalid saved place');
          found.set(value.path, value);
        } catch {
          report(
            'A saved place could not be read. Clear saved places to remove damaged entries.',
          );
        }
      }
    } catch {
      report(
        'Browser storage is unavailable. Saved places last for this visit only.',
      );
    }
    for (const [path, place] of temporary) found.set(path, place);
    return [...found.values()];
  }
  return {
    read,
    save(place) {
      if (!validPlace(place)) return false;
      try {
        storage.setItem(PLACE_PREFIX + place.path, JSON.stringify(place));
        temporary.delete(place.path);
        return true;
      } catch {
        temporary.set(place.path, place);
        report(
          'This place could not be saved to your browser. It remains available for this visit only.',
        );
        return false;
      }
    },
    clear() {
      try {
        const keys = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key?.startsWith(PLACE_PREFIX)) keys.push(key);
        }
        for (const key of keys) storage.removeItem(key);
        temporary.clear();
        return true;
      } catch {
        report(
          'Some saved places could not be removed. You can clear this site’s data in your browser settings.',
        );
        return false;
      }
    },
  };
}
