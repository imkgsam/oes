import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Builds the empty persisted model used by the local Command Hub MVP.
export function createEmptyState() {
  return {
    version: 1,
    tasks: {},
    threads: {},
    ownerships: [],
    events: [],
    messages: [],
  };
}

// Normalizes loaded JSON so older or partial state files keep working.
export function normalizeState(rawState = {}) {
  return {
    ...createEmptyState(),
    ...rawState,
    tasks: rawState.tasks ?? {},
    threads: rawState.threads ?? {},
    ownerships: Array.isArray(rawState.ownerships) ? rawState.ownerships : [],
    events: Array.isArray(rawState.events) ? rawState.events : [],
    messages: Array.isArray(rawState.messages) ? rawState.messages : [],
  };
}

// Loads Hub state from disk and returns an empty state when the file is absent.
export async function loadState(stateFile) {
  try {
    const content = await readFile(stateFile, 'utf8');
    return normalizeState(JSON.parse(content));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return createEmptyState();
    }
    throw error;
  }
}

// Persists Hub state as stable, readable JSON for local inspection and tests.
export async function saveState(stateFile, state) {
  await mkdir(path.dirname(stateFile), { recursive: true });
  await writeFile(stateFile, `${JSON.stringify(normalizeState(state), null, 2)}\n`, 'utf8');
}
