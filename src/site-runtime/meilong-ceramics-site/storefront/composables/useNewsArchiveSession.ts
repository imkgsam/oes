import type { Ref } from 'vue'
import {
  upsertBoundedNewsArchiveSession,
  type NewsArchiveSessionState
} from '../utils/news-archive-session-cache'

interface RestoreNewsArchiveStateOptions {
  committedPublishVersion: number
  initialPage: number
  totalPages: number
}

interface SaveNewsArchiveStateOptions extends NewsArchiveSessionState {}

// useNewsArchiveSession keeps each in-app News archive route's pagination and viewport state for detail-route returns.
export function useNewsArchiveSession(sessionKey: Ref<string>) {
  const archiveStates = useState<Record<string, NewsArchiveSessionState>>('news-archive-sessions', () => ({}))

  // restoreArchiveState returns a valid saved state while treating a new route or refreshed browser session as the first page.
  function restoreArchiveState({
    committedPublishVersion,
    initialPage,
    totalPages
  }: RestoreNewsArchiveStateOptions): NewsArchiveSessionState {
    const savedState = archiveStates.value[sessionKey.value]

    if (!savedState || savedState.committedPublishVersion !== committedPublishVersion) {
      return { committedPublishVersion, loadedPage: initialPage, scrollY: 0 }
    }

    return {
      committedPublishVersion,
      loadedPage: clampLoadedPage(savedState.loadedPage, initialPage, totalPages),
      scrollY: Number.isFinite(savedState.scrollY) ? Math.max(0, savedState.scrollY) : 0,
    }
  }

  // saveArchiveState records the current in-app route without making pagination state part of the public URL or server render.
  function saveArchiveState({ committedPublishVersion, loadedPage, scrollY }: SaveNewsArchiveStateOptions): void {
    if (import.meta.server) {
      return
    }

    archiveStates.value = upsertBoundedNewsArchiveSession(archiveStates.value, sessionKey.value, {
      committedPublishVersion,
      loadedPage: Math.max(1, Math.floor(loadedPage)),
      scrollY: Number.isFinite(scrollY) ? Math.max(0, scrollY) : 0,
    })
  }

  return { restoreArchiveState, saveArchiveState }
}

// clampLoadedPage restores only pages that still exist in the same committed publication and filter session.
function clampLoadedPage(savedPage: number, initialPage: number, totalPages: number): number {
  const normalizedPage = Number.isFinite(savedPage)
    ? Math.max(initialPage, Math.floor(savedPage))
    : initialPage
  return Math.min(normalizedPage, Math.max(initialPage, totalPages))
}
