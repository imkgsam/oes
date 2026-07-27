# Inspirations Masonry Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an SSR-first `/inspirations` gallery with indexable category pages, uncropped original-ratio Masonry cards, and progressive Load more interaction.

**Architecture:** A static local content module owns categories, image dimensions, alt text, and filter membership. Two thin route files render one archive component so `/inspirations` and `/inspirations/:category` remain direct SSR destinations. CSS Multi-column performs the visual Masonry layout without client-side DOM reordering; a small client state only reveals additional already-known cards.

**Tech Stack:** Nuxt 4 SSR, Vue 3 Composition API, TypeScript, local image assets, CSS Multi-column, Node assertion display verification.

---

## File Structure

- Create: `src/site-runtime/meilong-ceramics-site/storefront/data/inspirations.ts`
  - Owns the typed category catalogue, local asset metadata, category filtering, and canonical page copy.
- Create: `src/site-runtime/meilong-ceramics-site/storefront/public/images/inspirations/`
  - Contains immutable first-version gallery fixtures copied from existing local storefront assets, so the gallery owns no third-party runtime image dependency.
- Create: `src/site-runtime/meilong-ceramics-site/storefront/components/InspirationMasonryGallery.vue`
  - Owns progressive item reveal and the semantic gallery/card list.
- Create: `src/site-runtime/meilong-ceramics-site/storefront/components/InspirationArchivePage.vue`
  - Owns route-level SEO metadata, category navigation, JSON-LD, and archive composition.
- Create: `src/site-runtime/meilong-ceramics-site/storefront/pages/inspirations/index.vue`
  - Renders the all-content canonical archive.
- Create: `src/site-runtime/meilong-ceramics-site/storefront/pages/inspirations/[category].vue`
  - Resolves validated category routes and returns a 404 for unknown category slugs.
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/components/SiteHeader.vue`
  - Adds a discoverable primary navigation entry.
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/assets/css/main.css`
  - Adds isolated gallery styles, breakpoints, focus states, entry animation, and reduced-motion fallback.
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/server/routes/sitemap.xml.ts`
  - Adds `/inspirations` and the five canonical category URLs to the sitemap.
- Modify: `src/site-runtime/meilong-ceramics-site/scripts/verify-blog-news-display.mjs`
  - Verifies public SSR output, canonical metadata, schema, sitemaps, filtering, and no-crop CSS rules.

### Task 1: Add the Failing Public-Page Contract

**Files:**
- Modify: `src/site-runtime/meilong-ceramics-site/scripts/verify-blog-news-display.mjs`

- [ ] **Step 1: Add the `inspirations` verification scope and static source paths.**

```js
const inspirationArchiveSource = readFileSync(join(root, 'storefront/components/InspirationArchivePage.vue'), 'utf8')
const inspirationGallerySource = readFileSync(join(root, 'storefront/components/InspirationMasonryGallery.vue'), 'utf8')
const inspirationDataSource = readFileSync(join(root, 'storefront/data/inspirations.ts'), 'utf8')
const verificationScope = process.argv.includes('inspirations') ? 'inspirations' : 'all'
```

- [ ] **Step 2: Add a failing SSR contract for the archive and Kids category.**

```js
async function verifyInspirationsExperience() {
  const archive = await text(`${storefrontBaseUrl}/inspirations`)
  assert.match(archive, /inspiration-archive/)
  assert.match(archive, /<h1[^>]*>Inspiration for everyday spaces<\/h1>/)
  assert.match(archive, /inspiration-masonry/)
  assert.match(archive, /Load more inspiration/)
  assert.match(archive, /CollectionPage/)
  assert.match(archive, /canonical" href="https:\/\/meilong-ceramics\.com\/inspirations"/)

  const kids = await text(`${storefrontBaseUrl}/inspirations/kids`)
  assert.match(kids, /Kid-friendly spaces/)
  assert.match(kids, /aria-current="page"/)
  assert.match(kids, /canonical" href="https:\/\/meilong-ceramics\.com\/inspirations\/kids"/)
}
```

- [ ] **Step 3: Protect the implementation constraints with source assertions.**

```js
assert.match(inspirationGallerySource, /loading="eager"/)
assert.match(inspirationGallerySource, /loading="lazy"/)
assert.match(inspirationDataSource, /width: 1500/)
assert.match(inspirationDataSource, /height: 2250/)
assert.match(inspirationArchiveSource, /CollectionPage/)
assert.doesNotMatch(inspirationGallerySource, /object-fit:\s*cover/)
```

- [ ] **Step 4: Run the focused verification and confirm it fails due to the missing route/module.**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site test:display -- inspirations`

Expected: non-zero exit with `ENOENT` for `InspirationArchivePage.vue` before production code exists.

### Task 2: Create Typed Local Content and SSR Routes

**Files:**
- Create: `src/site-runtime/meilong-ceramics-site/storefront/data/inspirations.ts`
- Create: `src/site-runtime/meilong-ceramics-site/storefront/pages/inspirations/index.vue`
- Create: `src/site-runtime/meilong-ceramics-site/storefront/pages/inspirations/[category].vue`

- [ ] **Step 1: Define explicit category and image contracts with local static source paths.**

```ts
export type InspirationCategorySlug = 'kids' | 'pets' | 'color' | 'small-spaces' | 'seasonal-styling'

export interface InspirationItem {
  id: string
  src: string
  width: number
  height: number
  alt: string
  title: string
  categories: InspirationCategorySlug[]
}

export interface InspirationCategory {
  slug: InspirationCategorySlug
  label: string
  title: string
  description: string
}
```

- [ ] **Step 2: Populate at least 24 cards using the existing local `blog-reference` and `news-reference` image files, preserving their measured dimensions exactly.**

Copy the selected image fixtures into the gallery-owned directory before referencing them:

```bash
mkdir -p storefront/public/images/inspirations
cp storefront/public/images/blog-reference/{spa-experience.jpg,vanity-size-matters.jpg,shower-niche-care.jpg,toilet-seat-bidet.jpg} storefront/public/images/inspirations/
cp storefront/public/images/news-reference/{roca-almaty-showroom.jpg,roca-antonio-lupi.webp,roca-city.jpg,roca-climate-leaders.jpg,roca-delhi-gallery.jpg,roca-ecovadis-platinum.jpg,roca-global-website.jpg,roca-group-2024-results.jpg,roca-group-results.jpg,roca-health-hub.jpg,roca-kazakhstan-plant.jpg,roca-mediterranean-rituals.jpg,roca-phoenix.jpg,roca-sydney-gallery.jpg,roca-uia-2026.jpg,roca-zero-emission-facility.png} storefront/public/images/inspirations/
```

```ts
{
  id: 'vanity-size-matters',
  src: '/images/inspirations/vanity-size-matters.jpg',
  width: 1500,
  height: 2250,
  alt: 'A tall bathroom vanity composition with a mirror and layered storage.',
  title: 'A vertical pause for the morning routine',
  categories: ['kids', 'small-spaces']
}
```

- [ ] **Step 3: Expose narrow pure helpers for route resolution and filtering.**

```ts
export function resolveInspirationCategory(slug: string | undefined): InspirationCategory | undefined {
  return inspirationCategories.find((category) => category.slug === slug)
}

export function inspirationItemsFor(category?: InspirationCategory): InspirationItem[] {
  return category
    ? inspirationItems.filter((item) => item.categories.includes(category.slug))
    : inspirationItems
}
```

- [ ] **Step 4: Add the all-content page and category validation route.**

```vue
<!-- pages/inspirations/index.vue -->
<script setup lang="ts">
const category = undefined
</script>

<template>
  <InspirationArchivePage :category="category" />
</template>
```

```vue
<!-- pages/inspirations/[category].vue -->
<script setup lang="ts">
import { resolveInspirationCategory } from '../../data/inspirations'

const route = useRoute()
const category = resolveInspirationCategory(String(route.params.category))

if (!category) {
  throw createError({ statusCode: 404, statusMessage: 'Inspiration category not found' })
}
</script>

<template>
  <InspirationArchivePage :category="category" />
</template>
```

- [ ] **Step 5: Run the focused verification and confirm it now fails only because the archive component is absent.**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site test:display -- inspirations`

Expected: non-zero exit with `ENOENT` for `InspirationArchivePage.vue`.

### Task 3: Implement SSR Archive, SEO, and Progressive Load More

**Files:**
- Create: `src/site-runtime/meilong-ceramics-site/storefront/components/InspirationArchivePage.vue`
- Create: `src/site-runtime/meilong-ceramics-site/storefront/components/InspirationMasonryGallery.vue`

- [ ] **Step 1: Implement archive metadata and CollectionPage/ItemList structured data from the SSR-visible cards.**

```ts
const canonicalPath = computed(() => props.category ? `/inspirations/${props.category.slug}` : '/inspirations')
const canonicalUrl = computed(() => `${publicBaseUrl}${canonicalPath.value}`)
const visibleItems = computed(() => inspirationItemsFor(props.category).slice(0, INITIAL_ITEM_COUNT))

useSeoMeta({
  title: () => `${heading.value} | Meilong Ceramics`,
  description: description,
  ogTitle: heading,
  ogDescription: description,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})
useHead(() => ({
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(structuredData.value) }]
}))
```

- [ ] **Step 2: Render semantic navigation and one H1.**

```vue
<main class="inspiration-archive site-shell" aria-labelledby="inspiration-title">
  <header class="inspiration-archive__header">
    <p class="inspiration-archive__eyebrow">Curated spaces</p>
    <h1 id="inspiration-title">{{ heading }}</h1>
    <p class="inspiration-archive__lede">{{ description }}</p>
  </header>
  <nav class="inspiration-filter" aria-label="Browse inspiration categories">
    <NuxtLink to="/inspirations" :aria-current="!category ? 'page' : undefined">All inspiration</NuxtLink>
    <NuxtLink v-for="entry in inspirationCategories" :key="entry.slug" :to="`/inspirations/${entry.slug}`">
      {{ entry.label }}
    </NuxtLink>
  </nav>
  <InspirationMasonryGallery :items="items" />
</main>
```

- [ ] **Step 3: Render original-ratio image cards and reveal a further batch only after a button action.**

```vue
<script setup lang="ts">
const INITIAL_ITEM_COUNT = 12
const visibleCount = ref(INITIAL_ITEM_COUNT)
const visibleItems = computed(() => props.items.slice(0, visibleCount.value))
const canLoadMore = computed(() => visibleCount.value < props.items.length)

function loadMore(): void {
  visibleCount.value = Math.min(visibleCount.value + INITIAL_ITEM_COUNT, props.items.length)
}
</script>

<template>
  <section class="inspiration-masonry" aria-label="Inspiration gallery" aria-live="polite">
    <article v-for="(item, index) in visibleItems" :key="item.id" class="inspiration-card" :style="{ '--entry-index': index }">
      <img :src="item.src" :width="item.width" :height="item.height" :alt="item.alt" :loading="index < 4 ? 'eager' : 'lazy'" />
      <h2>{{ item.title }}</h2>
    </article>
  </section>
  <button v-if="canLoadMore" class="inspiration-load-more" type="button" @click="loadMore">Load more inspiration</button>
</template>
```

- [ ] **Step 4: Re-run the focused verifier.**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site test:display -- inspirations`

Expected: archive and category SSR assertions pass, before sitemap and styling assertions are added.

### Task 4: Add Layout, Navigation, Sitemap, and Regression Coverage

**Files:**
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/assets/css/main.css`
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/components/SiteHeader.vue`
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/server/routes/sitemap.xml.ts`
- Modify: `src/site-runtime/meilong-ceramics-site/scripts/verify-blog-news-display.mjs`

- [ ] **Step 1: Add CSS Multi-column Masonry with no fixed image ratio or crop rule.**

```css
.inspiration-masonry {
  column-count: 4;
  column-gap: 18px;
}

.inspiration-card {
  break-inside: avoid;
  display: inline-block;
  width: 100%;
  margin: 0 0 18px;
  animation: inspiration-card-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--entry-index) * 34ms);
}

.inspiration-card img {
  display: block;
  width: 100%;
  height: auto;
}

@media (max-width: 1024px) { .inspiration-masonry { column-count: 3; } }
@media (max-width: 760px) { .inspiration-masonry { column-count: 2; } }
@media (max-width: 480px) { .inspiration-masonry { column-count: 1; } }
@media (prefers-reduced-motion: reduce) { .inspiration-archive * { animation: none !important; transition: none !important; } }
```

- [ ] **Step 2: Add the `/inspirations` primary navigation link.**

```vue
<NuxtLink to="/inspirations">Inspiration</NuxtLink>
```

- [ ] **Step 3: Add all six canonical inspiration URLs to `staticCanonicalPaths`.**

```ts
'/inspirations',
'/inspirations/kids',
'/inspirations/pets',
'/inspirations/color',
'/inspirations/small-spaces',
'/inspirations/seasonal-styling'
```

- [ ] **Step 4: Extend assertions for CSS crop prevention, current navigation, all category canonicals, and sitemap entries.**

```js
assert.match(inspirationCss, /\.inspiration-masonry\s*\{[^}]*column-count: 4;/)
assert.match(inspirationCss, /\.inspiration-card\s*\{[^}]*break-inside: avoid;/)
assert.match(inspirationCss, /\.inspiration-card img\s*\{[^}]*height: auto;/)
assert.doesNotMatch(inspirationCss, /\.inspiration-card img\s*\{[^}]*object-fit:/)
assert.match(sitemap, /https:\/\/meilong-ceramics\.com\/inspirations\/pets/)
```

- [ ] **Step 5: Run the focused verifier and typecheck.**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site test:display -- inspirations && pnpm --dir src/site-runtime/meilong-ceramics-site typecheck:storefront`

Expected: both commands exit `0`.

### Task 5: Visual and Production Verification

**Files:**
- No source edits expected.

- [ ] **Step 1: Run the isolated site boundary check and full display suite.**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site verify:boundaries && pnpm --dir src/site-runtime/meilong-ceramics-site test:display`

Expected: both commands exit `0`.

- [ ] **Step 2: Build the production storefront.**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site build:storefront`

Expected: Nuxt production build exits `0`.

- [ ] **Step 3: Start the frontend and inspect `/inspirations` plus `/inspirations/kids` at 1440px and 390px with Playwright screenshots.**

```ts
await page.setViewportSize({ width: 1440, height: 1100 })
await page.goto('http://127.0.0.1:4300/inspirations')
await expect(page.getByRole('heading', { name: 'Inspiration for everyday spaces' })).toBeVisible()
await page.getByRole('button', { name: 'Load more inspiration' }).click()
await page.screenshot({ path: 'tmp/inspirations-desktop.png', fullPage: true })
```

- [ ] **Step 4: Confirm screenshots show no horizontal overflow, no overlapping cards, untouched portrait/landscape aspect ratios, functioning current category state, and no visual movement under `prefers-reduced-motion: reduce`.**

- [ ] **Step 5: Commit only the feature packet, plan, and Inspirations implementation files.**

```bash
git add docs/plans/features/inspirations-masonry-gallery.md \
  docs/superpowers/plans/2026-07-16-inspirations-masonry-gallery.md \
  src/site-runtime/meilong-ceramics-site/storefront
git commit -m "feat: add inspirations masonry gallery"
```

## Plan Self-Review

- Spec coverage: Tasks 2-4 cover all six routes, category filtering, original aspect ratios, local assets, SSR, Load more, sitemap inclusion, metadata, JSON-LD, accessibility, responsive layout, and reduced motion. Task 5 covers visual and production verification.
- Placeholder scan: no TODO/TBD markers or unstated test commands remain.
- Type consistency: every route obtains `InspirationCategory` through `resolveInspirationCategory`; archive rendering consumes `InspirationItem[]`; structured data only consumes the component's initial SSR slice.
