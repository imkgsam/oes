<script setup lang="ts">
const props = defineProps<{
  image: {
    desktop: string
    mobile?: string
    alt: string
  }
  products: Array<{
    title: string
    collection: string
    price: string
    image: {
      desktop: string
      mobile?: string
      alt: string
    }
  }>
}>()

const activeProductIndex = ref<number | null>(null)
const dialogRef = ref<HTMLDialogElement | null>(null)

const hotspots = [
  { x: 26, y: 67, mobileX: 24, mobileY: 67 },
  { x: 33, y: 45, mobileX: 30, mobileY: 42 },
  { x: 55, y: 65, mobileX: 52, mobileY: 62 },
  { x: 63, y: 46, mobileX: 60, mobileY: 40 },
  { x: 82, y: 12, mobileX: 84, mobileY: 17 }
]

const swatches = ['White', 'Black', 'Brushed brass']

const orderedProducts = computed(() => {
  if (activeProductIndex.value === null) return props.products
  const active = props.products[activeProductIndex.value]
  if (!active) return props.products
  return [active, ...props.products.filter((_, index) => index !== activeProductIndex.value)]
})

// Opens the reference-style product dialog after Vue has rendered it at the document root.
watch(activeProductIndex, async (index) => {
  if (index === null) return
  await nextTick()
  if (dialogRef.value && !dialogRef.value.open) {
    dialogRef.value.showModal()
  }
})

onBeforeUnmount(() => {
  if (dialogRef.value?.open) {
    dialogRef.value.close()
  }
})

// Opens the look-product drawer and prioritizes the clicked hotspot product.
const openDrawer = (index: number) => {
  activeProductIndex.value = index
}

// Closes the look-product drawer without changing the mocked product data.
const closeDrawer = () => {
  activeProductIndex.value = null
}
</script>

<template>
  <section class="dxv-look-section dxv-reveal" aria-label="Explore the aesthetic">
    <div class="dxv-look-head">
      <h2>Explore the Aesthetic</h2>
      <p>
        Architectural intent defines the MAIDSTONE | DXV bath narrative. These visual perspectives
        articulate a vision of rejuvenation.
      </p>
    </div>
    <div class="dxv-look-media">
      <HomeResponsiveImage :image="image" />
      <button
        v-for="(hotspot, index) in hotspots"
        :key="`${hotspot.x}-${hotspot.y}`"
        class="dxv-hotspot-dot"
        type="button"
        :aria-label="`Open ${products[index]?.title ?? 'product'} in look`"
        :style="{
          '--desktop-x': `${hotspot.x}%`,
          '--desktop-y': `${hotspot.y}%`,
          '--mobile-x': `${hotspot.mobileX}%`,
          '--mobile-y': `${hotspot.mobileY}%`
        }"
        @click="openDrawer(index)"
      />
    </div>

    <Teleport to="body">
      <Transition name="dxv-drawer">
        <dialog
          v-if="activeProductIndex !== null"
          ref="dialogRef"
          class="right-modal dialog-modal dialog-open dxv-look-dialog"
          scroll-lock
          @cancel.prevent="closeDrawer"
          @click.self="closeDrawer"
        >
          <div class="flex flex-col h-full overflow-hidden dxv-look-dialog-shell">
            <div class="flex-none px-4 border-0 relative dxv-look-dialog-head">
              <h4 class="py-4 title-6">Products in Look</h4>
              <button class="dxv-look-dialog-close" type="button" aria-label="Close dialog" @click="closeDrawer">
                <span class="w-6 h-6 block">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <path d="M6.34375 7.25L21.7233 22.6296" stroke="currentColor" stroke-width="2" />
                    <path d="M6.34375 22.6562L21.7233 7.27667" stroke="currentColor" stroke-width="2" />
                  </svg>
                </span>
              </button>
            </div>

            <div class="flex-1 overflow-x-hidden overflow-y-auto scrollbar dxv-look-dialog-scroll" aria-label="Cart">
              <div class="px-4 pb-8 pt-4 flex flex-col gap-8 dxv-look-dialog-list">
                <div
                  v-for="(product, index) in orderedProducts"
                  :key="product.title"
                  class="product-card-wrapper"
                  :class="index === 0 ? 'order-1' : 'order-2'"
                >
                  <div class="dxv-look-card">
                    <div class="dxv-look-card-inner">
                      <a class="dxv-look-card-link" href="#">
                        <div class="dxv-look-card-image">
                          <HomeResponsiveImage :image="product.image" />
                        </div>
                        <div class="flex flex-col gap-1 dxv-look-card-title">
                          <div>
                            <span>{{ product.collection }}</span>{{ product.title }}
                          </div>
                        </div>
                      </a>
                      <div class="dxv-look-card-swatches" aria-label="Available finishes">
                        <button
                          v-for="swatch in swatches"
                          :key="`${product.title}-${swatch}`"
                          type="button"
                          :aria-label="swatch"
                        />
                      </div>
                      <div class="flex justify-between items-center dxv-look-card-bottom">
                        <div>
                          <div>
                            <span class="price">{{ product.price }}</span>
                          </div>
                        </div>
                        <div class="text-xs text-gray-600 hover:text-black flex items-center gap-1 relative z-10 max-lg:pr-2.5 dxv-look-card-compare">
                          <input class="h-3.5 w-3.5" type="checkbox" />
                          <label class="cursor-pointer select-none">Compare</label>
                        </div>
                      </div>
                      <div class="product-card-wishlist-wrapper absolute top-0 right-0 left-auto z-10 flex items-center dxv-look-card-project">
                        <span class="product-card-wishlist-label bg-white/75 pointer-events-none whitespace-nowrap text-xs font-medium uppercase tracking-wide text-black opacity-0 overflow-hidden transition-[opacity] duration-600 ease-out w-[210px] h-[50px] flex items-center justify-center pr-6">Add to Project</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </dialog>
      </Transition>
    </Teleport>
  </section>
</template>
