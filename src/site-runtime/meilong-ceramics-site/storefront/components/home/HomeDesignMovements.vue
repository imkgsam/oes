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
} = useDragRail({ itemSelector: '.dxv-movement-card', settleMs: 520 })

// Connects the rendered movement rail to the element ref owned by useDragRail.
function setDragRailElement(element: unknown): void {
  track.value = element as HTMLElement | null
}
</script>

<template>
  <section class="dxv-movements dxv-reveal" aria-label="Design movements">
    <div class="dxv-movement-head">
      <div>
        <h2>Design Movements</h2>
        <p>
          MAIDSTONE | DXV Design Movements are tangible representations of our brand’s commitment
          to presenting a unique expression of true heritage.
        </p>
      </div>
    </div>
    <div
      :ref="setDragRailElement"
      class="dxv-movement-grid"
      :class="{ dragging: isDragging, settling: isSettling }"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @click.capture="handleClick"
      @dragstart.prevent
    >
      <a v-for="item in items" :key="item.title" class="dxv-movement-card" :href="item.href">
        <HomeResponsiveImage :image="item.image" />
        <div class="dxv-movement-copy">
          <h3>{{ item.title }}</h3>
          <p>{{ item.copy }}</p>
        </div>
      </a>
    </div>
  </section>
</template>
