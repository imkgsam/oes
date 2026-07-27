<script setup lang="ts">
const props = defineProps<{
  title: string
  reversed?: boolean
  items: Array<{
    title: string
    collection: string
    price: string
    image: {
      desktop: string
      mobile?: string
      alt: string
    }
    href?: string
  }>
}>()

const track = ref<HTMLElement | null>(null)
const isDraggingProducts = ref(false)
const dragState = reactive({
  active: false,
  pointerId: 0,
  startX: 0,
  startScrollLeft: 0,
  moved: false,
  suppressClick: false,
})

// Moves the product rail by one visible card.
const scrollByCard = (direction: 1 | -1) => {
  const element = track.value
  if (!element) return

  const card = element.querySelector<HTMLElement>('.dxv-product-card')
  element.scrollBy({
    left: (card?.offsetWidth ?? 300) * direction,
    behavior: 'smooth'
  })
}

// Starts pointer-driven rail dragging without stealing controls such as compare or add buttons.
const startProductDrag = (event: PointerEvent) => {
  if (event.pointerType === 'touch') return

  const element = track.value
  const target = event.target instanceof Element ? event.target : null
  if (!element || event.button !== 0 || target?.closest('button, input, label')) return

  event.preventDefault()
  dragState.active = true
  dragState.pointerId = event.pointerId
  dragState.startX = event.clientX
  dragState.startScrollLeft = element.scrollLeft
  dragState.moved = false
  dragState.suppressClick = false
  isDraggingProducts.value = true
  element.setPointerCapture(event.pointerId)
}

// Translates horizontal pointer movement into native scrollLeft for mouse drag support.
const moveProductDrag = (event: PointerEvent) => {
  const element = track.value
  if (!element || !dragState.active || event.pointerId !== dragState.pointerId) return

  const deltaX = event.clientX - dragState.startX
  if (Math.abs(deltaX) > 4) {
    dragState.moved = true
    dragState.suppressClick = true
    event.preventDefault()
  }
  element.scrollLeft = dragState.startScrollLeft - deltaX
}

// Ends rail dragging and releases pointer capture after mouse or touch cancellation.
const endProductDrag = (event: PointerEvent) => {
  const element = track.value
  if (!element || !dragState.active || event.pointerId !== dragState.pointerId) return

  dragState.active = false
  isDraggingProducts.value = false
  if (element.hasPointerCapture(event.pointerId)) {
    element.releasePointerCapture(event.pointerId)
  }
}

// Prevents a drag gesture on product links from becoming an accidental click.
const suppressDraggedClick = (event: MouseEvent) => {
  if (!dragState.suppressClick) return
  event.preventDefault()
  event.stopPropagation()
  dragState.suppressClick = false
}
</script>

<template>
  <section class="dxv-product-section dxv-reveal" :class="{ reversed: props.reversed }" aria-label="Product carousel">
    <div class="dxv-section-intro">
      <p class="dxv-section-kicker">MAIDSTONE | DXV</p>
      <h2 class="dxv-section-title">{{ props.title }}</h2>
      <div class="dxv-carousel-controls">
        <button class="dxv-arrow-button" type="button" :aria-label="`Previous ${props.title}`" @click="scrollByCard(-1)">
          <svg class="dxv-arrow-icon prev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true">
            <path d="M1.20215 1.20209L7.50215 7.50209L1.20215 13.8021" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" />
          </svg>
        </button>
        <button class="dxv-arrow-button" type="button" :aria-label="`Next ${props.title}`" @click="scrollByCard(1)">
          <svg class="dxv-arrow-icon" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true">
            <path d="M1.20215 1.20209L7.50215 7.50209L1.20215 13.8021" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" />
          </svg>
        </button>
      </div>
    </div>
    <div
      ref="track"
      class="dxv-product-track"
      :class="{ dragging: isDraggingProducts }"
      @pointerdown="startProductDrag"
      @pointermove="moveProductDrag"
      @pointerup="endProductDrag"
      @pointercancel="endProductDrag"
      @click.capture="suppressDraggedClick"
      @dragstart.prevent
    >
      <article v-for="item in props.items" :key="item.title" class="dxv-product-card">
        <a class="dxv-product-media" :href="item.href ?? '#'" draggable="false">
          <HomeResponsiveImage :image="item.image" />
        </a>
        <div class="dxv-product-copy">
          <a :href="item.href ?? '#'">
            <h3><span class="dxv-product-kicker">{{ item.collection }}</span>{{ item.title }}</h3>
          </a>
          <div class="dxv-product-meta">
            <span class="dxv-price">{{ item.price }}</span>
            <label class="dxv-product-compare">
              <input type="checkbox" />
              <span>Compare</span>
            </label>
          </div>
        </div>
        <button class="dxv-card-project" type="button" :aria-label="`Add ${item.title} to project`">
          <span>Add to Project</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6.5 3.5h11v17l-5.5-3.7-5.5 3.7v-17Z" />
          </svg>
        </button>
      </article>
    </div>
  </section>
</template>
