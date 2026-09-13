// Per-company background marks, persisted in localStorage and keyed by source_url.
const STORAGE_KEY = 'hnavi.marks.v1';
export const MARK_COLORS = ['yellow', 'green'];

// Returns null when storage is unavailable so the in-memory copy is kept.
function readStoredMarks() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(raw || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, color]) => MARK_COLORS.includes(color)));
  } catch {
    return {};
  }
}

export function createMarkStore() {
  let marks = readStoredMarks() ?? {};

  return {
    storageKey: STORAGE_KEY,
    get: (id) => (Object.hasOwn(marks, id) ? marks[id] : null),
    set(id, color) {
      // Merge with the latest stored state so changes made in other tabs are not overwritten.
      marks = readStoredMarks() ?? marks;
      if (MARK_COLORS.includes(color)) marks[id] = color;
      else delete marks[id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
      } catch {
        // Storage full or blocked: the mark still applies for this page view.
      }
    },
    reload() {
      marks = readStoredMarks() ?? marks;
    },
  };
}
