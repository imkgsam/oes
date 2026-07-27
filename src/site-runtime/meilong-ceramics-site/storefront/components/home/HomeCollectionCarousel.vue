<script setup lang="ts">
const props = defineProps<{
  items: Array<{
    title: string
    eyebrow: string
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
  progress,
  scrollByItem,
  updateProgress,
  startDrag,
  moveDrag,
  endDrag,
  handleClick,
} = useDragRail({ itemSelector: '.dxv-image-card' })

// Connects the rendered collection rail to the element ref owned by useDragRail.
function setDragRailElement(element: unknown): void {
  track.value = element as HTMLElement | null
}
</script>

<template>
  <section class="dxv-collection dxv-reveal" aria-label="Featured categories">
    <div
      :ref="setDragRailElement"
      class="dxv-collection-track"
      :class="{ dragging: isDragging, settling: isSettling }"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @click.capture="handleClick"
      @scroll.passive="updateProgress"
      @dragstart.prevent
    >
      <article v-for="item in props.items" :key="item.title" class="dxv-image-card">
        <a class="dxv-image-link" :href="item.href" :aria-label="item.title" draggable="false">
          <HomeResponsiveImage :image="item.image" />
        </a>
        <div class="dxv-card-copy">
          <h2>{{ item.title }}</h2>
        </div>
      </article>
    </div>
    <div class="dxv-collection-progress" aria-hidden="true">
      <span :style="{ width: `${Math.max(12, progress)}%` }" />
    </div>
    <div class="dxv-collection-controls" aria-label="Collection carousel controls">
      <button class="dxv-arrow-button" type="button" aria-label="Previous categories" @click="scrollByItem(-1)">
        <Icon name="lucide:arrow-left" size="18" />
      </button>
      <button class="dxv-arrow-button" type="button" aria-label="Next categories" @click="scrollByItem(1)">
        <Icon name="lucide:arrow-right" size="18" />
      </button>
    </div>
  </section>
</template>
