<script setup lang="ts">
import type { PublicViewEnvelope } from '../types/public-view'

const props = withDefaults(defineProps<{
  items: PublicViewEnvelope[]
  categories: PublicViewEnvelope[]
  presentation?: 'index' | 'category'
  activeCategorySlug?: string
}>(), {
  presentation: 'index'
})

const categoryDirectory = computed(
  () => new Map(props.categories.map((category) => [category.resourceId, { label: textField(category.payload.display_name) ?? category.slug, slug: category.slug }]))
)

// articleTitle resolves the published title while keeping archive cards usable for incomplete legacy data.
function articleTitle(item: PublicViewEnvelope): string {
  return textField(item.payload.title) ?? item.slug
}

// articleSummary returns the published summary used below each archive image.
function articleSummary(item: PublicViewEnvelope): string {
  return textField(item.payload.summary) ?? ''
}

// articleImage picks the published cover and preserves a stable local fallback.
function articleImage(item: PublicViewEnvelope): string {
  return textField(item.payload.cover_image) ?? '/images/meilong-showroom-hero.png'
}

// articleImageAlt keeps published alternative text ahead of the visible title fallback.
function articleImageAlt(item: PublicViewEnvelope): string {
  return textField(item.payload.cover_image_alt) ?? articleTitle(item)
}

// isCategoryFeature reserves the top category story for the archive's sole horizontal feature.
function isCategoryFeature(index: number): boolean {
  return props.presentation === 'category' && index === 0
}

// articleCategories maps public category references to the labels and slugs used by archive cards.
function articleCategories(item: PublicViewEnvelope): Array<{ label: string; slug: string }> {
  const categoryIds = item.payload.category_ids
  if (!Array.isArray(categoryIds)) {
    return []
  }

  return categoryIds
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
    .map((id) => categoryDirectory.value.get(id))
    .filter((category): category is { label: string; slug: string } => Boolean(category))
}

// articleCardCategory selects one visible category without changing the article's complete category assignment.
function articleCardCategory(item: PublicViewEnvelope): { label: string; slug: string } | undefined {
  const categories = articleCategories(item)
  if (props.presentation === 'category' && props.activeCategorySlug) {
    return categories.find((category) => category.slug === props.activeCategorySlug) ?? categories[0]
  }

  return categories[0]
}

// articlePublishedAt formats the public publishing timestamp consistently during SSR and hydration.
function articlePublishedAt(item: PublicViewEnvelope): string | null {
  const publishedAt = textField(item.payload.published_at)
  if (!publishedAt || Number.isNaN(Date.parse(publishedAt))) {
    return null
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(new Date(publishedAt))
}

// articlePublishedDateTime returns the machine-readable timestamp only when it is valid.
function articlePublishedDateTime(item: PublicViewEnvelope): string | undefined {
  const publishedAt = textField(item.payload.published_at)
  return publishedAt && !Number.isNaN(Date.parse(publishedAt)) ? publishedAt : undefined
}

// textField narrows unknown public-view payload values before rendering them in the archive.
function textField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
</script>

<template>
  <section
    v-if="items.length"
    class="dxv-blog-index-grid"
    :class="{ 'dxv-blog-category-grid': props.presentation === 'category' }"
    aria-label="Published stories and guides"
  >
    <article
      v-for="(item, index) in items"
      :key="item.resourceId"
      class="dxv-blog-index-card"
      :class="{ 'dxv-blog-category-grid__featured': isCategoryFeature(index) }"
      :style="{ '--dxv-blog-card-delay': `${index * 55}ms` }"
    >
      <div class="dxv-blog-index-card__media-frame">
        <NuxtLink class="dxv-blog-index-card__media" :to="`/blogs/${item.slug}`" :aria-label="articleTitle(item)">
          <img
            :src="articleImage(item)"
            :alt="articleImageAlt(item)"
            width="1200"
            height="900"
            :loading="index > 2 ? 'lazy' : undefined"
          />
        </NuxtLink>
        <span
          v-if="articleCardCategory(item)"
          class="dxv-blog-index-card__category"
          aria-label="Article category"
        >
          <span>{{ articleCardCategory(item)?.label }}</span>
        </span>
      </div>

      <div class="dxv-blog-index-card__content">
        <ul v-if="articlePublishedAt(item)" class="dxv-blog-index-card__meta" aria-label="Article metadata">
          <li>
            <Icon name="lucide:calendar-days" aria-hidden="true" />
            <time :datetime="articlePublishedDateTime(item)">{{ articlePublishedAt(item) }}</time>
          </li>
          <li>
            <Icon name="lucide:message-circle" aria-hidden="true" />
            <span>0 comments</span>
          </li>
        </ul>

        <h2>
          <NuxtLink :to="`/blogs/${item.slug}`">{{ articleTitle(item) }}</NuxtLink>
        </h2>
        <p v-if="articleSummary(item)">{{ articleSummary(item) }}</p>
        <NuxtLink class="dxv-blog-index-card__read-more" :to="`/blogs/${item.slug}`">Read more</NuxtLink>
      </div>
    </article>
  </section>

  <section v-else class="dxv-blog-index-empty" aria-live="polite">
    <h2>Stories are being prepared.</h2>
    <p>New material, design, and project notes will appear here once they are published.</p>
  </section>
</template>
