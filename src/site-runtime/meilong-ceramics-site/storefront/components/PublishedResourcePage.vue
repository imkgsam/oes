<script setup lang="ts">
import type { PublicViewEnvelope, ResourceCollection } from '../types/public-view'

const props = defineProps<{
  collection: ResourceCollection
  resource: PublicViewEnvelope
}>()

const payload = computed(() => props.resource.payload)
const title = computed(() => field('display_title') ?? field('title') ?? props.resource.slug)
const description = computed(
  () => field('display_description') ?? field('summary') ?? field('description')
)
const heroImage = computed(() => {
  const images = payload.value.images
  if (Array.isArray(images) && images.length > 0 && typeof images[0]?.url === 'string') {
    return images[0].url
  }
  return field('cover_image') ?? field('image')
})
const detailLabel = computed(() => {
  if (props.collection === 'products') {
    return 'Product public view'
  }
  if (props.collection === 'categories') {
    return 'Category public view'
  }
  return props.collection === 'blog' ? 'Insight article' : 'Company news'
})

// field reads string payload fields while keeping the component tolerant of P1 resource shapes.
function field(name: string): string | undefined {
  const value = payload.value[name]
  return typeof value === 'string' ? value : undefined
}
</script>

<template>
  <main class="site-shell">
    <SiteHeader />

    <article class="resource-layout">
      <section class="resource-copy">
        <p class="eyebrow">{{ detailLabel }} / {{ resource.locale }}</p>
        <h1>{{ title }}</h1>
        <p v-if="description" class="lede">{{ description }}</p>
        <div class="hero-actions">
          <NuxtLink class="text-button" to="/contact">Inquire now</NuxtLink>
          <a class="text-button secondary" href="mailto:sales@meilong-ceramics.com">Email sales</a>
        </div>
        <dl class="resource-meta">
          <div>
            <dt>Publish version</dt>
            <dd>{{ resource.publishVersion }}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{{ new Date(resource.updatedAt).toLocaleDateString('en-US') }}</dd>
          </div>
          <div v-if="field('model')">
            <dt>Model</dt>
            <dd>{{ field('model') }}</dd>
          </div>
          <div v-if="field('brand')">
            <dt>Brand</dt>
            <dd>{{ field('brand') }}</dd>
          </div>
        </dl>
      </section>

      <figure v-if="heroImage" class="resource-visual">
        <img :src="heroImage" :alt="title" loading="eager" />
      </figure>

      <section v-if="field('body_html')" class="rich-text" v-html="field('body_html')" />

      <section v-if="Array.isArray(payload.specs)" class="spec-grid" aria-label="Specifications">
        <div v-for="spec in payload.specs" :key="`${spec.name}-${spec.value}`" class="spec-row">
          <span>{{ spec.name }}</span>
          <strong>{{ spec.value }} {{ spec.unit }}</strong>
          <small>{{ spec.group }}</small>
        </div>
      </section>
    </article>

    <SiteFooter />
  </main>
</template>
