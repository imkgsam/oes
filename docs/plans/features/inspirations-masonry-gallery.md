# Inspirations Kids Gallery

> Status note: 本 packet 只记录最初冻结 Meilong Storefront 展示与静态 fixture 的交付范围。“No CMS model / Site Runtime data source”仅描述当时实现切片，不再定义长期 Site Management 边界；后续 OES 对接以 `docs/architecture/services/site-service.md` 与 `docs/contracts/site-service/public-views.md` 为准，且不得改变本 packet 已冻结的前端布局与交互。

> Production fallback rule: `westelm-kids-reference.ts` 与现有远端 reference images 只能作为测试 fixture / 原展示证据。Site Management integration 上线后，Runtime 缺少数据或同步失败不得回退这些静态内容；空根页、Category not found 与 last-complete-publication 行为以稳定真相源为准。

## Goal

- Recreate the content body of the current West Elm Kids reference page at `/inspirations` while retaining the existing Meilong Header and Footer.
- Match the captured hierarchy: `SHOP BY STYLE`, `Kids`, the reference subtitle, four filters, and a four-column shortest-column Masonry gallery.
- Use the reference page's image URLs and descriptive copy as user-directed visual test data.

## Scope

- Implementation surface: `src/site-runtime/meilong-ceramics-site/storefront/**`.
- `/inspirations` remains the sole canonical public route for this slice.
- SSR renders the title, filters, the first 28 tiles, metadata, canonical URL, and a matching first-batch `ItemList` JSON-LD.
- An `IntersectionObserver` requests the next 20 tiles when the gallery-end sentinel enters a 520px prefetch margin. Every tile holds a ratio-aware skeleton until its image has loaded; the next batch is inserted as ratio-aware skeleton cards into the active Masonry columns, then is replaced in place as each image loads. Reduced-motion disables the motion.
- Client-side filters reset to the first 28 matching tiles, then continue the same automatic loading behavior.
- The captured gallery uses four columns from `1024px` upward, three columns from `768px` to `1023px`, and two columns below `768px`, with a shared `8px` gutter. The content container fills the available page width up to `1680px` and is then centered, without horizontal overflow beneath the existing fixed site Header.

## Explicit Non-goals

- No inspiration detail routes, CMS model, Site Runtime data source, cross-service public API, or contract changes. The only local route is the narrowly scoped same-origin reference-image proxy described below.
- No `Load more` behavior: the captured reference page uses a continuous gallery rather than the earlier archive pagination model.
- No download, redistribution, or local persistence of third-party image files by this feature.

## Data and Governance

- The image URLs and short page copy are direct remote reference fixtures at the user's explicit request, not Meilong-owned production assets.
- The gallery's same-origin image route proxies only the captured `www.westelm.com/netstorage/images/edam/` fixture paths and forwards the reference-page referer required by the source host. It does not persist or redistribute third-party files, but it remains an intentional external runtime dependency; replacing these with owned assets is required before a production launch.
- Capture outputs (screenshot, HTML, text, and metadata) are stored only in ignored `tmp/reference-captures/` paths.
- No Site Runtime, service contract, database schema, tenant context, or permissions behavior changes.

## Verification

- The authorized local Chrome CDP session captured the reference DOM, four-column positions, image crop ratios, title typography, filters, and current image sources.
- Visual checks: the desktop page initially renders 28 tiles, then scrolling appends batches at 48, 68, 88, 108, and 111 tiles with the skeleton state visible during each append. The captured filter counts are All 111, Bedroom 48, Nursery 93, and Playroom 111. At 390px, the local page is two columns with `scrollWidth === viewportWidth`.
- 2026-07-17 commands passed:
  - `pnpm --dir src/site-runtime/meilong-ceramics-site test:display -- inspirations`
  - `pnpm --dir src/site-runtime/meilong-ceramics-site typecheck:storefront`
  - `pnpm --dir src/site-runtime/meilong-ceramics-site build:storefront`

## Current Status

- `implementation-complete / remote-fixture-risk-accepted-by-user`
