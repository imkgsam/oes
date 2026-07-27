export type GallerySwipeInput = {
  deltaX: number
  deltaY: number
  stageWidth: number
  scale: number
}

export type GallerySwipeDragInput = {
  deltaX: number
  stageWidth: number
}

export type GalleryPinchZoomInput = {
  startDistance: number
  currentDistance: number
  startScale: number
}

export type GalleryPanInput = {
  startPan: number
  delta: number
  scale: number
  stageSize: number
  mediaSize: number
  originRatio: number
}

export type GalleryPointerOriginInput = {
  pointerOffset: number
  stageSize: number
  mediaSize: number
}

const MIN_GALLERY_ZOOM_SCALE = 1
const MAX_GALLERY_ZOOM_SCALE = 3
const GALLERY_SWIPE_MIN_DISTANCE = 60
const GALLERY_SWIPE_WIDTH_RATIO = 0.18

// Keeps all lightbox zoom inputs inside the same predictable inspection range.
export function clampGalleryZoomScale(scale: number) {
  return Math.round(Math.min(MAX_GALLERY_ZOOM_SCALE, Math.max(MIN_GALLERY_ZOOM_SCALE, scale)) * 100) / 100
}

// Converts a two-finger distance change into a bounded zoom scale for the active gallery image.
export function getGalleryPinchZoom(input: GalleryPinchZoomInput) {
  if (input.startDistance <= 0) {
    return clampGalleryZoomScale(input.startScale)
  }
  return clampGalleryZoomScale(input.startScale * (input.currentDistance / input.startDistance))
}

// Decides whether a horizontal one-finger drag should move the lightbox to an adjacent image.
export function getGallerySwipeStep(input: GallerySwipeInput) {
  if (input.scale > 1.01) {
    return 0
  }
  if (Math.abs(input.deltaY) > Math.abs(input.deltaX) * 0.85) {
    return 0
  }
  const threshold = Math.max(GALLERY_SWIPE_MIN_DISTANCE, input.stageWidth * GALLERY_SWIPE_WIDTH_RATIO)
  if (input.deltaX <= -threshold) {
    return 1
  }
  if (input.deltaX >= threshold) {
    return -1
  }
  return 0
}

// Keeps swipe dragging attached to the finger while preventing more than one image width of overscroll.
export function getGallerySwipeDragOffset(input: GallerySwipeDragInput) {
  if (input.stageWidth <= 0) {
    return 0
  }
  return Math.round(Math.min(input.stageWidth, Math.max(-input.stageWidth, input.deltaX)))
}

// Converts a pointer position inside the lightbox stage into the matching transform origin on the rendered media box.
export function getGalleryPointerOriginPercent(input: GalleryPointerOriginInput) {
  if (input.stageSize <= 0) {
    return 50
  }

  const mediaSize = input.mediaSize > 0 ? input.mediaSize : input.stageSize
  const mediaStart = (input.stageSize - mediaSize) / 2
  const origin = ((input.pointerOffset - mediaStart) / mediaSize) * 100

  return Math.round(Math.min(100, Math.max(0, origin)) * 100) / 100
}

// Bounds image panning so a zoomed image can be inspected without drifting away from the viewport.
export function getBoundedGalleryPan(input: GalleryPanInput) {
  if (input.scale <= 1.01) {
    return 0
  }
  if (input.stageSize <= 0 || input.mediaSize <= 0 || input.mediaSize * input.scale <= input.stageSize) {
    return 0
  }

  const originRatio = Math.min(1, Math.max(0, input.originRatio))
  const mediaStart = (input.stageSize - input.mediaSize) / 2
  const scaledStartWithoutPan = mediaStart + (1 - input.scale) * input.mediaSize * originRatio
  const scaledEndWithoutPan = scaledStartWithoutPan + input.mediaSize * input.scale
  const minPan = input.stageSize - scaledEndWithoutPan
  const maxPan = -scaledStartWithoutPan
  const nextPan = input.startPan + input.delta

  return Math.round(Math.min(maxPan, Math.max(minPan, nextPan)))
}
