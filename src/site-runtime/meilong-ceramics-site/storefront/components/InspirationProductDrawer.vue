<script setup lang="ts">
import type { InspirationHotspotProduct } from '~/data/westelm-kids-reference'

defineProps<{
  products: InspirationHotspotProduct[]
}>()

const emit = defineEmits<{
  close: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
// Routes every inspiration hotspot product card to the local PDP under test.
const testProductDetailHref = 'http://127.0.0.1:4300/products/maidstone-20-inch-pedestal-sink-4-inch-faucet-center-138-pds21-4d'
const { isFavorite, toggleFavorite } = useGuestCommerce()

// Converts reference-only inspiration products into stable snapshots for the shared guest Favorites store.
function toCommerceProduct(product: InspirationHotspotProduct) {
  return {
    productKey: `${product.collection}-${product.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    title: product.title,
    href: testProductDetailHref,
    image: referenceImageSrc(product.image),
    price: product.price,
  }
}

// referenceImageSrc keeps drawer product imagery on the same approved reference-image proxy as the gallery.
function referenceImageSrc(sourceUrl: string) {
  return `/api/reference-images?src=${encodeURIComponent(sourceUrl)}`
}

// requestClose delegates drawer state ownership to the inspiration lightbox while covering every dialog exit path.
function requestClose() {
  emit('close')
}

// Mounting promotes this drawer into the browser top layer so it remains above the existing image lightbox.
onMounted(() => {
  if (dialogRef.value && !dialogRef.value.open) {
    dialogRef.value.showModal()
  }
})

// Vue detaches the still-open dialog after its leave transition so the drawer remains in the top layer for the full exit animation.
</script>

<template>
  <dialog
    ref="dialogRef"
    class="right-modal dialog-modal dialog-open dxv-look-dialog westelm-kids-inspiration__product-drawer"
    aria-labelledby="inspiration-product-drawer-title"
    scroll-lock
    @cancel.prevent="requestClose"
    @click.self="requestClose"
  >
    <div class="flex flex-col h-full overflow-hidden dxv-look-dialog-shell">
      <div class="flex-none px-4 border-0 relative dxv-look-dialog-head">
        <h4 id="inspiration-product-drawer-title" class="py-4 title-6">Products in Look</h4>
        <button class="dxv-look-dialog-close" type="button" aria-label="Close product drawer" @click="requestClose">
          <span class="w-6 h-6 block">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M6.34375 7.25L21.7233 22.6296" stroke="currentColor" stroke-width="2" />
              <path d="M6.34375 22.6562L21.7233 7.27667" stroke="currentColor" stroke-width="2" />
            </svg>
          </span>
        </button>
      </div>

      <div class="flex-1 overflow-x-hidden overflow-y-auto scrollbar dxv-look-dialog-scroll" aria-label="Products in inspiration image">
        <div class="px-4 pb-8 pt-4 flex flex-col gap-8 dxv-look-dialog-list">
          <article
            v-for="(product, index) in products"
            :key="product.title"
            class="product-card-wrapper"
            :class="index === 0 ? 'order-1' : 'order-2'"
          >
            <div class="dxv-look-card">
              <div class="dxv-look-card-inner">
                <a class="dxv-look-card-link" :href="testProductDetailHref" :aria-label="`View ${product.title}`">
                  <div class="dxv-look-card-image">
                    <img :src="referenceImageSrc(product.image)" :alt="product.imageAlt">
                  </div>
                  <div class="flex flex-col gap-1 dxv-look-card-title">
                    <div>
                      <span>{{ product.collection }}</span>{{ product.title }}
                    </div>
                  </div>
                  <div class="flex justify-between items-center dxv-look-card-bottom">
                    <span class="price">{{ product.price }}</span>
                    <span class="westelm-kids-inspiration__product-drawer-link">View details</span>
                  </div>
                </a>
                <button
                  class="westelm-kids-inspiration__product-favorite"
                  type="button"
                  :class="{ 'is-favorited': isFavorite(toCommerceProduct(product).productKey) }"
                  :aria-label="isFavorite(toCommerceProduct(product).productKey) ? `Remove ${product.title} from Favorites` : `Add ${product.title} to Favorites`"
                  :aria-pressed="isFavorite(toCommerceProduct(product).productKey)"
                  @click.stop="toggleFavorite(toCommerceProduct(product))"
                >
                  <svg width="21" height="19" viewBox="0 0 21 19" aria-hidden="true">
                    <path d="M10.5 17.25S1.5 12.1 1.5 6.45C1.5 3.9 3.45 2 5.9 2c1.42 0 2.86.72 3.72 1.88L10.5 5.1l.88-1.22C12.24 2.72 13.68 2 15.1 2c2.45 0 4.4 1.9 4.4 4.45 0 5.65-9 10.8-9 10.8Z" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </dialog>
</template>
