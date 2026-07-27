<script setup lang="ts">
import type { PublicViewEnvelope } from '../types/public-view'

const props = withDefaults(defineProps<{
  activeCategorySlug?: string
  categories?: PublicViewEnvelope[]
}>(), {
  categories: () => []
})

const isOpen = ref(false)
const categorySwitcher = ref<HTMLElement | null>(null)

const activeCategoryLabel = computed(() => {
  const activeCategory = props.categories.find((category) => category.slug === props.activeCategorySlug)
  return activeCategory ? categoryName(activeCategory) : 'All stories'
})

// categoryName resolves the published label used by the archive category switcher.
function categoryName(category: PublicViewEnvelope): string {
  return typeof category.payload.display_name === 'string' && category.payload.display_name.length > 0
    ? category.payload.display_name
    : category.slug
}

// categoryPath returns the Storefront-owned archive route for one published category slug.
function categoryPath(category: PublicViewEnvelope): string {
  return `/blogs/categories/${category.slug}`
}

// isActiveCategory keeps the current archive visible in the category switcher's link state.
function isActiveCategory(slug?: string): boolean {
  return slug ? props.activeCategorySlug === slug : !props.activeCategorySlug
}

// toggleMenu expands or collapses the category panel without changing the current archive route.
function toggleMenu(): void {
  isOpen.value = !isOpen.value
}

// closeMenu collapses the panel after a choice, Escape, or a pointer action outside the switcher.
function closeMenu(): void {
  isOpen.value = false
}

// handleOutsidePointerDown prevents the open menu from obscuring the archive after an external click.
function handleOutsidePointerDown(event: PointerEvent): void {
  if (!isOpen.value || categorySwitcher.value?.contains(event.target as Node)) {
    return
  }

  closeMenu()
}

// handleKeyDown gives keyboard users a predictable way to close the category panel.
function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

// The switcher owns its lightweight global close listeners for the mounted page lifetime.
onMounted(() => {
  document.addEventListener('pointerdown', handleOutsidePointerDown)
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsidePointerDown)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <nav ref="categorySwitcher" class="dxv-blog-index-category-nav" aria-label="Browse articles by category">
    <div class="dxv-blog-category-switcher" :class="{ 'is-open': isOpen }">
      <button
        class="dxv-blog-category-switcher__trigger"
        type="button"
        :aria-expanded="isOpen"
        aria-controls="blog-category-switcher-panel"
        :aria-label="`Browse articles by category. Current selection: ${activeCategoryLabel}`"
        @click="toggleMenu"
      >
        <span>{{ activeCategoryLabel }}</span>
        <span class="dxv-blog-category-switcher__chevron" aria-hidden="true" />
      </button>

      <Transition name="dxv-blog-category-panel">
        <div
          v-show="isOpen"
          id="blog-category-switcher-panel"
          class="dxv-blog-category-switcher__panel"
          aria-label="Article category options"
        >
          <div class="dxv-blog-category-switcher__panel-head">
            <span>Categories</span>
            <button type="button" aria-label="Close category options" @click="closeMenu">
              <span class="dxv-blog-category-switcher__close-mark" aria-hidden="true" />
            </button>
          </div>

          <ul>
            <li>
              <NuxtLink
                to="/blogs"
                :class="{ 'is-active': isActiveCategory() }"
                :aria-current-value="isActiveCategory() ? 'page' : 'false'"
                @click="closeMenu"
              >
                All stories
              </NuxtLink>
            </li>
            <li v-for="category in categories" :key="category.resourceId">
              <NuxtLink
                :to="categoryPath(category)"
                :class="{ 'is-active': isActiveCategory(category.slug) }"
                :aria-current-value="isActiveCategory(category.slug) ? 'page' : 'false'"
                @click="closeMenu"
              >
                {{ categoryName(category) }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </Transition>
    </div>
  </nav>
</template>
