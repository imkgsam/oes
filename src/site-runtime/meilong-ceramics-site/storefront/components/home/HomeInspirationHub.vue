<script setup lang="ts">
defineProps<{
  items: Array<{
    title: string
    copy: string
    href: string
    image: {
      desktop: string
      mobile?: string
      alt: string
    }
  }>
}>()

const {
  track,
  isDragging,
  isSettling,
  startDrag,
  moveDrag,
  endDrag,
  handleClick,
  updateProgress,
} = useDragRail({ itemSelector: '.dxv-story-card', settleMs: 520 })

// Connects the rendered inspiration rail to the element ref owned by useDragRail.
function setDragRailElement(element: unknown): void {
  track.value = element as HTMLElement | null
}
</script>

<template>
  <section class="dxv-inspiration dxv-reveal" aria-label="Inspiration Hub">
    <div class="dxv-inspiration-intro">
      <div class="dxv-inspiration-headline">
        <h2>Inspiration Hub</h2>
        <a class="dxv-underline dxv-inspiration-cta-mobile" href="/blogs">Read more</a>
      </div>
      <p class="dxv-inspiration-lede">
        Professional vision and artistic references offer a glimpse of the MAIDSTONE | DXV aesthetic across different eras and environments. Browse these curated perspectives for the refined home.
      </p>
      <a class="dxv-underline dxv-inspiration-cta-desktop" href="/blogs">Read more</a>
    </div>
    <div
      :ref="setDragRailElement"
      class="dxv-inspiration-track"
      :class="{ dragging: isDragging, settling: isSettling }"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @click.capture="handleClick"
      @scroll.passive="updateProgress"
      @dragstart.prevent
    >
      <article v-for="item in items" :key="item.title" class="dxv-story-card">
        <a class="dxv-story-card__media" :href="item.href" draggable="false">
          <HomeResponsiveImage :image="item.image" />
        </a>
        <div class="dxv-story-copy">
          <a class="dxv-story-card__content" :href="item.href">
            <h3>{{ item.title }}</h3>
            <p>{{ item.copy }}</p>
          </a>
          <div class="dxv-story-actions">
            <a class="dxv-story-cta dxv-story-cta-desktop" :href="item.href">Discover More</a>
            <a class="dxv-story-cta dxv-story-cta-mobile" :href="item.href">Read More</a>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
