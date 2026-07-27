import { onBeforeUnmount, ref } from 'vue'

interface DragRailOptions {
  itemSelector: string
  excludedSelector?: string
  settleMs?: number
}

// Coordinates horizontal rail dragging, smooth release settling, and scroll progress for carousel-like sections.
export const useDragRail = (options: DragRailOptions) => {
  const track = ref<HTMLElement | null>(null)
  const isDragging = ref(false)
  const isSettling = ref(false)
  const wasDragged = ref(false)
  const progress = ref(0)
  let dragStartX = 0
  let dragStartScrollLeft = 0
  let settlingTimer: number | null = null
  let progressFrame: number | null = null

  // Batches rail progress updates into a single visual frame instead of running layout reads for every input event.
  const updateProgress = () => {
    if (progressFrame !== null) return

    progressFrame = window.requestAnimationFrame(() => {
      progressFrame = null
      const element = track.value
      if (!element) return

      const maxScroll = element.scrollWidth - element.clientWidth
      progress.value = maxScroll <= 0 ? 100 : Math.min(100, Math.max(0, (element.scrollLeft / maxScroll) * 100))
    })
  }

  const clearSettling = () => {
    if (!settlingTimer) return
    window.clearTimeout(settlingTimer)
    settlingTimer = null
  }

  const settleToNearestItem = () => {
    const element = track.value
    if (!element || !wasDragged.value) {
      updateProgress()
      return
    }

    const items = Array.from(element.querySelectorAll<HTMLElement>(options.itemSelector))
    if (!items.length) {
      updateProgress()
      return
    }

    const current = element.scrollLeft
    const nearest = items.reduce((candidate, item) => {
      const candidateDelta = Math.abs(candidate.offsetLeft - current)
      const itemDelta = Math.abs(item.offsetLeft - current)
      return itemDelta < candidateDelta ? item : candidate
    }, items[0]!)

    isSettling.value = true
    element.scrollTo({ left: nearest.offsetLeft, behavior: 'smooth' })
    clearSettling()
    settlingTimer = window.setTimeout(() => {
      isSettling.value = false
      updateProgress()
    }, options.settleMs ?? 460)
  }

  const scrollByItem = (direction: 1 | -1) => {
    const element = track.value
    if (!element) return

    const item = element.querySelector<HTMLElement>(options.itemSelector)
    element.scrollBy({
      left: (item?.offsetWidth ?? 320) * direction,
      behavior: 'smooth',
    })
    window.setTimeout(updateProgress, options.settleMs ?? 460)
  }

  const startDrag = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return

    const element = track.value
    const target = event.target instanceof Element ? event.target : null
    if (!element || event.button !== 0 || target?.closest(options.excludedSelector ?? 'button, input, label')) return

    clearSettling()
    isSettling.value = false
    event.preventDefault()
    isDragging.value = true
    wasDragged.value = false
    dragStartX = event.clientX
    dragStartScrollLeft = element.scrollLeft
    element.setPointerCapture(event.pointerId)
  }

  const moveDrag = (event: PointerEvent) => {
    const element = track.value
    if (!element || !isDragging.value) return

    const delta = event.clientX - dragStartX
    if (Math.abs(delta) > 4) wasDragged.value = true
    event.preventDefault()
    element.scrollLeft = dragStartScrollLeft - delta
    updateProgress()
  }

  const endDrag = (event: PointerEvent) => {
    const element = track.value
    if (!element || !isDragging.value) return

    isDragging.value = false
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId)
    }
    settleToNearestItem()
  }

  const handleClick = (event: MouseEvent) => {
    if (!wasDragged.value) return
    event.preventDefault()
    event.stopPropagation()
    wasDragged.value = false
  }

  // Clears scheduled browser work when the owning rail component unmounts during a route change.
  onBeforeUnmount(() => {
    clearSettling()
    if (progressFrame !== null) {
      window.cancelAnimationFrame(progressFrame)
    }
  })

  return {
    track,
    isDragging,
    isSettling,
    progress,
    scrollByItem,
    updateProgress,
    startDrag,
    moveDrag,
    endDrag,
    handleClick,
  }
}
