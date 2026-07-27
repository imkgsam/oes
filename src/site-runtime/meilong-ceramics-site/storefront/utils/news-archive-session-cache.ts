export const NEWS_ARCHIVE_SESSION_LIMIT = 12

export interface NewsArchiveSessionState {
  committedPublishVersion: number
  loadedPage: number
  scrollY: number
}

// upsertBoundedNewsArchiveSession refreshes one route state and evicts oldest entries beyond the client limit.
export function upsertBoundedNewsArchiveSession(
  states: Readonly<Record<string, NewsArchiveSessionState>>,
  key: string,
  state: NewsArchiveSessionState
): Record<string, NewsArchiveSessionState> {
  const next = { ...states }
  delete next[key]
  next[key] = { ...state }
  const overflow = Object.keys(next).length - NEWS_ARCHIVE_SESSION_LIMIT
  if (overflow > 0) {
    for (const oldestKey of Object.keys(next).slice(0, overflow)) {
      delete next[oldestKey]
    }
  }
  return next
}
