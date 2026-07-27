# Roca-Aligned News Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the MAIDSTONE | DXV News archive, category archive, and article surface to match the layout and interaction model of `https://www.roca.com/about-roca/news` while retaining SSR-first rendering and canonical public URLs.

**Architecture:** Keep the Runtime public-view contract unchanged. The Storefront owns semantic page structure, an SSR-rendered archive feed, a progressively enhanced category/date filter rail, and URL-driven category navigation. The page must not depend on client-side card fetching, animation libraries, or an in-memory filter state to expose indexable News content.

**Tech Stack:** Nuxt 4 SSR, Vue 3, CSS, existing Runtime public-view composables, Node assertion-based display verification.

---

## File Structure

- Modify: `src/site-runtime/meilong-ceramics-site/storefront/components/NewsArchive.vue`
  - SSR archive hierarchy, Roca-aligned filter rail, semantic article card grid, and progressive `Load more` affordance.
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/components/NewsArticleView.vue`
  - Commercial News article hierarchy, breadcrumbs, metadata, and reading flow aligned with the archive.
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/assets/css/main.css`
  - Isolated `dxv-news-*` design system, motion, responsive filter behavior, and reduced-motion safety.
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/pages/news/index.vue`
  - Archive metadata and structured data that exactly describe the SSR-visible collection.
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/pages/news/category/[slug].vue`
  - Category-page title, canonical semantics, noindex page handling, and shared archive rendering.
- Modify: `src/site-runtime/meilong-ceramics-site/scripts/verify-blog-news-display.mjs`
  - HTML assertions for the visible archive/filter/detail structure and SEO metadata.

### Task 1: Add Regression Coverage For The Target Structure

**Files:**
- Modify: `src/site-runtime/meilong-ceramics-site/scripts/verify-blog-news-display.mjs`

- [ ] **Step 1: Write failing News archive assertions**

```js
assert.match(newsIndex, /dxv-news-archive/)
assert.match(newsIndex, /dxv-news-filter-rail/)
assert.match(newsIndex, /News categories/)
assert.match(newsIndex, /Browse by date/)
assert.match(newsIndex, /dxv-news-grid/)
assert.match(newsIndex, /dxv-news-card/)
assert.match(newsIndex, /Load more/)
```

- [ ] **Step 2: Run the focused display check and verify it fails because the new archive structure does not exist**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site test:display -- news`

Expected: assertion failure for `dxv-news-archive`.

- [ ] **Step 3: Add failing News detail assertions**

```js
assert.match(newsDetail, /dxv-news-article/)
assert.match(newsDetail, /aria-label="Breadcrumb"/)
assert.match(newsDetail, /itemtype="https:\/\/schema.org\/NewsArticle"/)
assert.match(newsDetail, /dxv-news-article__body/)
```

- [ ] **Step 4: Re-run the focused display check and verify the failure is specific to the missing detail structure**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site test:display -- news`

Expected: archive assertions fail before implementation; after archive implementation, detail assertions fail before detail implementation.

### Task 2: Implement The SSR Archive And Filter Rail

**Files:**
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/components/NewsArchive.vue`
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/pages/news/index.vue`
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/pages/news/category/[slug].vue`

- [ ] **Step 1: Preserve one visible `h1`, breadcrumbs, and article list semantics in SSR HTML**

```vue
<main class="dxv-news-archive" aria-labelledby="news-archive-title">
  <nav class="dxv-news-breadcrumbs" aria-label="Breadcrumb">...</nav>
  <header class="dxv-news-archive__title"><h1 id="news-archive-title">...</h1></header>
  <section class="dxv-news-grid" aria-label="Published company news">...</section>
</main>
```

- [ ] **Step 2: Implement category controls as canonical `<NuxtLink>` destinations, not client-only filtering**

```vue
<nav class="dxv-news-filter-rail" aria-label="News filters">
  <NuxtLink :to="allNewsPath()">All news</NuxtLink>
  <NuxtLink v-for="category in categories" :key="category.resourceId" :to="categoryPath(category)">
    {{ categoryName(category) }}
  </NuxtLink>
</nav>
```

- [ ] **Step 3: Implement the date disclosure as a non-destructive archive affordance**

```vue
<details class="dxv-news-date-filter">
  <summary>Browse by date</summary>
  <p>Published releases are ordered from newest to oldest.</p>
</details>
```

- [ ] **Step 4: Use real article links, sized cover images, `time`, and headings in each card**

```vue
<article v-for="item in items" :key="item.resourceId" class="dxv-news-card">
  <NuxtLink :to="contentPath(item)"><img :src="articleImage(item)" :alt="articleImageAlt(item)" width="960" height="640"></NuxtLink>
  <time :datetime="articlePublishedDateTime(item)">{{ articlePublishedAt(item) }}</time>
  <h2><NuxtLink :to="contentPath(item)">{{ articleTitle(item) }}</NuxtLink></h2>
</article>
```

- [ ] **Step 5: Add a no-JavaScript-safe `Load more` link only when a subsequent page actually exists**

```vue
<NuxtLink v-if="nextPagePath" class="dxv-news-load-more" :to="nextPagePath">Load more</NuxtLink>
```

- [ ] **Step 6: Run the focused display check and verify archive assertions pass**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site test:display -- news`

Expected: archive structure, categories, canonical category URLs, and visible article links pass.

### Task 3: Implement The Roca-Aligned Visual System

**Files:**
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/assets/css/main.css`

- [ ] **Step 1: Replace the current list layout with the target’s broad container, compact title, horizontal filter rail, and four-column card system**

```css
.dxv-news-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 32px 20px;
}

.dxv-news-card__media img {
  aspect-ratio: 4 / 5;
  object-fit: cover;
}
```

- [ ] **Step 2: Build CSS-only disclosure, hover overlay, focus states, and load-more progress treatment**

```css
.dxv-news-card__media::after { opacity: 0; transition: opacity 220ms ease; }
.dxv-news-card:hover .dxv-news-card__media::after { opacity: 1; }
.dxv-news-filter-rail details[open] > .dxv-news-filter-rail__panel { animation: dxv-news-panel-in 180ms ease-out both; }
```

- [ ] **Step 3: Add responsive grid collapse without hiding content or requiring a separate mobile implementation**

```css
@media (max-width: 1024px) { .dxv-news-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .dxv-news-grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Add a reduced-motion override for every News-specific transition and animation**

```css
@media (prefers-reduced-motion: reduce) {
  .dxv-news-archive *, .dxv-news-archive *::before, .dxv-news-archive *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 5: Run the focused display check and production typecheck**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site test:display -- news && pnpm --dir src/site-runtime/meilong-ceramics-site typecheck:storefront`

Expected: both commands exit `0`.

### Task 4: Implement The Article Surface And SEO Refinements

**Files:**
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/components/NewsArticleView.vue`
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/pages/news/index.vue`
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/pages/news/category/[slug].vue`

- [ ] **Step 1: Render the News article with semantic breadcrumbs, one headline, time metadata, primary image, and an `articleBody` container**

```vue
<article class="dxv-news-article" itemscope itemtype="https://schema.org/NewsArticle">
  <nav aria-label="Breadcrumb">...</nav>
  <header><h1 itemprop="headline">{{ title }}</h1></header>
  <figure><img itemprop="image" :src="heroImage" :alt="heroImageAlt"></figure>
  <div class="dxv-news-article__body" itemprop="articleBody"><div v-html="bodyHtml" /></div>
</article>
```

- [ ] **Step 2: Ensure archive and category JSON-LD describe only SSR-visible items and current canonical URLs**

```js
itemListElement: items.map((item, index) => ({
  '@type': 'ListItem',
  position: index + 1,
  item: { '@type': 'NewsArticle', headline: title, url: canonicalItemUrl }
}))
```

- [ ] **Step 3: Keep page two and later self-canonical and `noindex,follow`; keep only canonical archives in the sitemap**

```ts
meta: page > 1 ? [{ name: 'robots', content: 'noindex,follow' }] : []
```

- [ ] **Step 4: Run the focused display check and verify the article assertions pass**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site test:display -- news`

Expected: News archive, category archive, detail page, locale routes, and historical redirect all pass.

### Task 5: Full Verification

**Files:**
- No source edits required.

- [ ] **Step 1: Run boundary verification**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site verify:boundaries`

Expected: exit `0`.

- [ ] **Step 2: Run the complete display regression suite**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site test:display`

Expected: exit `0` with no assertion failures.

- [ ] **Step 3: Build the Storefront for SSR production output**

Run: `pnpm --dir src/site-runtime/meilong-ceramics-site build:storefront`

Expected: Nuxt build completes successfully.

- [ ] **Step 4: Visually inspect desktop and mobile local pages**

Open: `http://127.0.0.1:4300/news`, `http://127.0.0.1:4300/news/category/kitchen-sink`, and a News detail URL.

Expected: no horizontal overflow, visible keyboard focus, intact hover disclosure, primary image content preserved, and layout matches the Roca hierarchy.
