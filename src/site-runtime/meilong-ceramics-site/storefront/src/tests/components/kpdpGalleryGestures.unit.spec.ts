/// <reference types="jest" />

import {
  clampGalleryZoomScale,
  getBoundedGalleryPan,
  getGalleryPointerOriginPercent,
  getGalleryPinchZoom,
  getGallerySwipeDragOffset,
  getGallerySwipeStep
} from '../../../components/product/kpdpGalleryGestures'

describe('kpdpGalleryGestures', () => {
  it('switches to the next image when an unzoomed image is swiped left far enough', () => {
    expect(getGallerySwipeStep({ deltaX: -92, deltaY: 12, stageWidth: 360, scale: 1 })).toBe(1)
  })

  it('switches to the previous image when an unzoomed image is swiped right far enough', () => {
    expect(getGallerySwipeStep({ deltaX: 92, deltaY: 8, stageWidth: 360, scale: 1 })).toBe(-1)
  })

  it('does not switch images while zoomed or when the gesture is mostly vertical', () => {
    expect(getGallerySwipeStep({ deltaX: -120, deltaY: 4, stageWidth: 360, scale: 1.4 })).toBe(0)
    expect(getGallerySwipeStep({ deltaX: -90, deltaY: 110, stageWidth: 360, scale: 1 })).toBe(0)
  })

  it('lets unzoomed swipe dragging follow the finger across the full image width', () => {
    expect(getGallerySwipeDragOffset({ deltaX: -254, stageWidth: 363 })).toBe(-254)
    expect(getGallerySwipeDragOffset({ deltaX: 254, stageWidth: 363 })).toBe(254)
    expect(getGallerySwipeDragOffset({ deltaX: -500, stageWidth: 363 })).toBe(-363)
    expect(getGallerySwipeDragOffset({ deltaX: 500, stageWidth: 363 })).toBe(363)
    expect(getGallerySwipeDragOffset({ deltaX: 120, stageWidth: 0 })).toBe(0)
  })

  it('clamps pinch zoom between the normal and maximum zoom levels', () => {
    expect(getGalleryPinchZoom({ startDistance: 100, currentDistance: 180, startScale: 1.5 })).toBe(2.7)
    expect(getGalleryPinchZoom({ startDistance: 100, currentDistance: 320, startScale: 1.5 })).toBe(3)
    expect(getGalleryPinchZoom({ startDistance: 100, currentDistance: 20, startScale: 1.5 })).toBe(1)
    expect(clampGalleryZoomScale(2.456)).toBe(2.46)
  })

  it('keeps panned zoomed images inside a bounded inspection area', () => {
    expect(getBoundedGalleryPan({ startPan: 10, delta: 40, scale: 2, stageSize: 360, mediaSize: 300, originRatio: 0.5 })).toBe(50)
    expect(getBoundedGalleryPan({ startPan: 0, delta: 900, scale: 2, stageSize: 360, mediaSize: 300, originRatio: 0.5 })).toBe(120)
    expect(getBoundedGalleryPan({ startPan: 0, delta: -900, scale: 2, stageSize: 360, mediaSize: 300, originRatio: 0.5 })).toBe(-120)
    expect(getBoundedGalleryPan({ startPan: 0, delta: 900, scale: 2, stageSize: 360, mediaSize: 300, originRatio: 0.2 })).toBe(30)
    expect(getBoundedGalleryPan({ startPan: 0, delta: -900, scale: 2, stageSize: 360, mediaSize: 300, originRatio: 0.2 })).toBe(-210)
    expect(getBoundedGalleryPan({ startPan: 50, delta: 50, scale: 1, stageSize: 360, mediaSize: 300, originRatio: 0.5 })).toBe(0)
  })

  it('maps wheel zoom pointer positions to the rendered media box instead of the whole stage', () => {
    expect(getGalleryPointerOriginPercent({ pointerOffset: 632, stageSize: 1264, mediaSize: 1080 })).toBe(50)
    expect(getGalleryPointerOriginPercent({ pointerOffset: 1168, stageSize: 1264, mediaSize: 1080 })).toBe(99.63)
    expect(getGalleryPointerOriginPercent({ pointerOffset: 20, stageSize: 1264, mediaSize: 1080 })).toBe(0)
  })
})
