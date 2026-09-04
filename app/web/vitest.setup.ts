// Node 25 exposes an incomplete global localStorage unless --localstorage-file is set.
// Install a deterministic per-worker Storage implementation for the test environment.
const records = new Map<string, string>();
const storage: Storage = {
  clear: () => records.clear(),
  getItem: (key) => records.get(String(key)) ?? null,
  key: (index) => [...records.keys()][index] ?? null,
  get length() {
    return records.size;
  },
  removeItem: (key) => records.delete(String(key)),
  setItem: (key, value) => records.set(String(key), String(value)),
};
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: storage,
  writable: true,
});

// A render suite must not inherit real network reachability from happy-dom.
// Install the interceptor in the worker (rather than vitest.config.ts, whose
// environment options are cloned into fork workers and therefore cannot carry
// functions).
const happyWindow = window as typeof window & {
  happyDOM?: {
    settings: {
      fetch: {
        interceptor: unknown;
      };
    };
  };
};
if (happyWindow.happyDOM) {
  happyWindow.happyDOM.settings.fetch.interceptor = {
    beforeAsyncRequest: async ({ request, window: requestWindow }: any) => {
      const protocol = new URL(request.url).protocol;
      if (protocol === 'http:' || protocol === 'https:') {
        return new requestWindow.Response('', { status: 204 });
      }
    },
  };
}
