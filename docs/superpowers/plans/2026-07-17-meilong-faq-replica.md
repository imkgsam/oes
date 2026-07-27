# Meilong FAQ Replica Implementation Plan

> **For agentic workers:** Execute the steps inline with test-first changes. The shared worktree is intentionally dirty, so do not stage or commit unrelated work.

**Goal:** Add an SSR, accessible, responsive FAQ help page at `/faqs` with site-local structured data and the grouped accordion presentation approved for the Meilong storefront.

**Architecture:** Keep the FAQ page entirely Storefront-owned. A small typed data module holds display copy, grouping, order, and future locale metadata; the page consumes that module for both visible SSR markup and `FAQPage` JSON-LD. A focused visual component owns only accordion state and uses the existing global header/footer through the default layout.

**Tech Stack:** Nuxt 4, Vue 3 composition API, scoped CSS, Node display regression script.

---

### Task 1: Establish the FAQ regression contract before the page exists

**Files:**
- Modify: `src/site-runtime/meilong-ceramics-site/scripts/verify-blog-news-display.mjs`

- [ ] **Step 1: Add a failing `verifyFaqExperience()` call to the all-scope run and a test body that requests `/faqs`.**

  The test must require:

  ```js
  const faqPage = await text(`${storefrontBaseUrl}/faqs`)
  assert.match(faqPage, /<h1[^>]*>FAQ(?:s)?(?:\s*\/\s*Help)?<\/h1>/)
  assert.match(faqPage, /dxv-faq-page/)
  assert.match(faqPage, /aria-label="FAQ categories"/)
  assert.match(faqPage, /aria-expanded="false"/)
  assert.match(faqPage, /FAQPage/)
  assert.match(faqPage, /canonical" href="https:\/\/meilong-ceramics\.com\/faqs"/)
  ```

  Also assert that `/sitemap.xml` includes `/faqs`, the footer emits `href="/faqs"`, and `contact.vue` uses `to="/faqs"`.

- [ ] **Step 2: Run the targeted display regression and verify the expected red failure.**

  Run:

  ```bash
  pnpm --dir src/site-runtime/meilong-ceramics-site test:display
  ```

  Expected: the new FAQ assertions fail because the route and its markup do not yet exist.

### Task 2: Add a future-compatible, site-local FAQ data source

**Files:**
- Create: `src/site-runtime/meilong-ceramics-site/storefront/data/faqs.ts`

- [ ] **Step 1: Define the data contract and author the display fixture.**

  Export `FaqCategory` and `FaqEntry` types with the following fields:

  ```ts
  export type FaqEntry = {
    answer: string
    id: string
    question: string
    sort: number
  }

  export type FaqCategory = {
    id: string
    locale: 'en-US'
    questions: FaqEntry[]
    sort: number
    title: string
  }
  ```

  Export ordered `faqCategories` using original, concise English display copy inspired by the reference page's customer-service themes: `Orders & Shipping`, `Returns & Warranty`, `Product Care & Installation`, `Finishes & Samples`, and `Account & Support`. Do not copy Kingston Brass wording verbatim. Give each category three to five useful questions so every category remains meaningful in the layout.

- [ ] **Step 2: Export a pure `buildFaqPageStructuredData(canonicalUrl)` helper.**

  It must return a schema.org `FAQPage` object and map every local entry into:

  ```ts
  {
    '@type': 'Question',
    name: entry.question,
    acceptedAnswer: { '@type': 'Answer', text: entry.answer }
  }
  ```

  Keep this data module free of Nuxt composables, browser APIs, and OES imports so it can later be replaced by a site-managed provider without changing the view contract.

### Task 3: Build the semantic FAQ component

**Files:**
- Create: `src/site-runtime/meilong-ceramics-site/storefront/components/FaqHelpPage.vue`

- [ ] **Step 1: Render the approved information hierarchy.**

  Implement a `main.dxv-faq-page` containing:

  ```vue
  <header class="dxv-faq-page__hero">
    <p class="dxv-faq-page__eyebrow">Help &amp; Support</p>
    <h1 id="faq-page-title">FAQ / Help</h1>
    <p>Answers to common questions about ordering, product care, and support.</p>
  </header>
  ```

  Follow it with a desktop sticky category `nav` that links to the rendered category section IDs and becomes a horizontally scrollable, non-wrapping rail below the hero on small screens. Render every category and every answer in SSR markup; do not add client-only search, data fetching, or filter state.

- [ ] **Step 2: Implement a keyboard-accessible accordion.**

  Store the currently expanded question ID in `ref<string | null>(null)`. Each question must be a real button with `:aria-expanded`, `:aria-controls`, and an associated answer region with `role="region"` and an accessible label. The click handler opens the selected question and closes the previous one; clicking it again closes it. Keep the answer mounted for SSR and hide/reveal it with classes rather than relying on native `details` styling.

  Add a one-sentence summary comment above the handler explaining its responsibility, in line with the repository rule for new functions.

- [ ] **Step 3: Add visual states without excessive decoration.**

  Use a white/soft-warm surface, fine dividing lines, left-aligned type, plus/minus marks built with CSS pseudo-elements, and a subtle `transform`/`opacity` answer reveal. Include hover, focus-visible, active, and `prefers-reduced-motion` states. Do not use third-party animation or icon packages, image assets, gradients, or a cloned external header/footer.

  The responsive constraints are:

  ```css
  .dxv-faq-page__inner { width: min(1240px, calc(100% - 48px)); }
  @media (max-width: 760px) {
    .dxv-faq-page__inner { width: min(100% - 32px, 1240px); }
    /* one column; category rail scrolls horizontally; no horizontal page overflow */
  }
  ```

### Task 4: Add the route, metadata, and public discovery links

**Files:**
- Create: `src/site-runtime/meilong-ceramics-site/storefront/pages/faqs.vue`
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/components/home/HomeReplicaFooter.vue`
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/pages/contact.vue`
- Modify: `src/site-runtime/meilong-ceramics-site/storefront/server/routes/sitemap.xml.ts`

- [ ] **Step 1: Add `/faqs` as a default-layout SSR page.**

  Import `FaqHelpPage` and `buildFaqPageStructuredData`, set the canonical URL to `https://meilong-ceramics.com/faqs`, then emit:

  ```ts
  useSeoMeta({
    title: 'FAQ / Help | MAIDSTONE | DXV',
    description: 'Find answers about MAIDSTONE | DXV orders, shipping, returns, warranties, product care, and customer support.',
    ogTitle: 'FAQ / Help | MAIDSTONE | DXV',
    ogDescription: 'Answers to common ordering, product, and support questions from MAIDSTONE | DXV.',
    ogType: 'website',
    twitterCard: 'summary'
  })
  ```

  Add `htmlAttrs.lang = 'en-US'`, the canonical link, and exactly one JSON-LD script whose `innerHTML` is `JSON.stringify(buildFaqPageStructuredData(canonical))`.

- [ ] **Step 2: Repair existing support entry points.**

  Replace the `FAQ` footer placeholder path with `/faqs`. Replace the contact page's existing singular `/faq` `NuxtLink` with `/faqs`. Preserve every other link and its current behavior.

- [ ] **Step 3: Add `/faqs` to `staticCanonicalPaths` in the sitemap route.**

  Keep the page as a static storefront canonical; do not add it to a Runtime resource index or OES contract.

### Task 5: Turn the red test green and verify production behavior

**Files:**
- Modify: `src/site-runtime/meilong-ceramics-site/scripts/verify-blog-news-display.mjs`

- [ ] **Step 1: Extend the FAQ regression assertions for behavior and responsive safeguards.**

  Read `FaqHelpPage.vue` and assert the source includes `role="region"`, `aria-controls`, `@keydown.esc`, `@media (max-width: 760px)`, and `prefers-reduced-motion`. In the SSR response assert all five category headings, at least one question/answer pair, `dxv-header`, `dxv-footer`, `FAQPage`, and the `/faqs` canonical.

- [ ] **Step 2: Run the display regression and verify it passes.**

  Run:

  ```bash
  pnpm --dir src/site-runtime/meilong-ceramics-site test:display
  ```

  Expected: exit code `0`, including the new `/faqs` route, sitemap, link, structured-data, and SSR checks.

- [ ] **Step 3: Run type and production-build verification.**

  Run:

  ```bash
  pnpm --dir src/site-runtime/meilong-ceramics-site typecheck:storefront
  pnpm --dir src/site-runtime/meilong-ceramics-site build:storefront
  ```

  Expected: both commands exit `0` with no TypeScript error and a generated Nuxt production bundle.

- [ ] **Step 4: Inspect the local page at desktop and narrow mobile widths.**

  Verify the route uses the common header and footer, category anchors do not cause horizontal overflow, question controls remain legible and tappable, and reduced-motion mode does not leave an answer visually stuck between states.

## Plan self-review

- Coverage: Tasks 2–4 implement the approved local data source, `/faqs`, grouped accordion layout, existing site chrome, metadata, JSON-LD, sitemap, and support links. Task 5 covers SSR, accessibility markers, responsive CSS, build, and manual viewport verification.
- Scope: No OES resource, API, schema, locale-route, or CMS change is introduced; later dynamic sourcing is contained behind the typed data module.
- Consistency: `faqCategories`, `buildFaqPageStructuredData`, `FaqHelpPage`, `/faqs`, and `verifyFaqExperience` use one stable name throughout.
