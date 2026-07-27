// useArchivePaginationScroll provides the client-only scroll reset used by paginated article archives.
export function useArchivePaginationScroll() {
  // scrollArchivePaginationToTop moves readers to the next archive page's heading after an in-place pagination navigation.
  function scrollArchivePaginationToTop(event: MouseEvent): void {
    if (
      import.meta.server ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return { scrollArchivePaginationToTop }
}
