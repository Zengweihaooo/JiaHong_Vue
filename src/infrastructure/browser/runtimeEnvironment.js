const memoryStorage = new Map();

const fallbackSessionStorage = {
  getItem(key) {
    return memoryStorage.has(key) ? memoryStorage.get(key) : null;
  },
  setItem(key, value) {
    memoryStorage.set(key, String(value));
  },
  removeItem(key) {
    memoryStorage.delete(key);
  }
};

export function getSessionStorage() {
  return typeof globalThis.sessionStorage === "undefined"
    ? fallbackSessionStorage
    : globalThis.sessionStorage;
}

export function getNavigationEntry() {
  if (typeof globalThis.performance?.getEntriesByType !== "function") {
    return null;
  }
  return globalThis.performance.getEntriesByType("navigation")[0] || null;
}
