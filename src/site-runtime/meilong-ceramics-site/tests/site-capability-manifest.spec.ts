import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { MEILONG_SITE_CAPABILITY_MANIFEST } from '../runtime/src/site-capability-manifest'
import { MEILONG_RUNTIME_MODULE_OPTIONS } from '../runtime/src/site-runtime-options'
import { MEILONG_PUBLIC_PAGE_KEYS } from '../storefront/types/site-route-policy'

const expectedCapabilities = [
  'ABOUT',
  'BLOG_CATEGORY',
  'BLOG_DETAIL',
  'BLOG_LIST',
  'COLLECTION_DETAIL',
  'COLLECTION_LIST',
  'CONTACT',
  'FAQ',
  'HOME',
  'INSPIRATION',
  'INSPIRATION_CATEGORY',
  'NEWS_CATEGORY',
  'NEWS_DETAIL',
  'NEWS_LIST',
  'PRIVACY_POLICY',
  'PRODUCT_DETAIL',
  'RETURNS_REFUNDS',
  'SEARCH',
  'SERIES',
  'SHIPPING_DELIVERY',
  'TERMS_CONDITIONS',
  'WARRANTY'
] as const

const staticPageFiles = [
  'about.vue',
  'contact.vue',
  'faqs.vue',
  'index.vue',
  'privacy-policy.vue',
  'returns-refunds.vue',
  'search.vue',
  'series.vue',
  'shipping-delivery.vue',
  'terms-conditions.vue',
  'warranty.vue'
] as const

const governedRouteFiles = [
  'blogs/categories/[slug].vue',
  '[locale]/blogs/categories/[slug].vue',
  'news/categories/[slug].vue',
  '[locale]/news/categories/[slug].vue',
  'product/collections/index.vue',
  'products/[slug].vue',
  'collections/[collection].vue'
] as const

const retiredRouteFiles = [
  'blog/index.vue',
  'blog/[slug].vue',
  '[locale]/blog/[slug].vue',
  'blogs/category/index.vue',
  'blogs/category/[slug].vue',
  '[locale]/blogs/category/index.vue',
  '[locale]/blogs/category/[slug].vue',
  'news/category/[slug].vue',
  '[locale]/news/category/[slug].vue',
  'categories/index.vue',
  'categories/[slug].vue',
  '[locale]/categories/[slug].vue',
  'products/index.vue',
  'collections/index.vue'
] as const

describe('Meilong page capability manifest', () => {
  it('declares every current public page identity with only pageKey and actual locales', () => {
    expect(MEILONG_SITE_CAPABILITY_MANIFEST.pages.map((page) => page.pageKey)).toEqual(
      expectedCapabilities
    )
    for (const page of MEILONG_SITE_CAPABILITY_MANIFEST.pages) {
      expect(Object.keys(page).sort()).toEqual(['pageKey', 'supportedLocales'])
      expect(page.supportedLocales).toEqual(['en-US'])
    }
    expect(JSON.stringify(MEILONG_SITE_CAPABILITY_MANIFEST)).not.toMatch(
      /pageKind|route|layout|component|content|resource/i
    )
  })

  it('passes the exact complete manifest to Runtime Kit startup', () => {
    expect(MEILONG_RUNTIME_MODULE_OPTIONS.capabilityManifest).toBe(MEILONG_SITE_CAPABILITY_MANIFEST)
    expect(
      readFileSync(resolve(__dirname, '..', 'runtime', 'src', 'app.module.ts'), 'utf8')
    ).toContain('OesSiteRuntimeModule.forRootFromEnv(MEILONG_RUNTIME_MODULE_OPTIONS)')
  })

  it('keeps the Storefront route catalog and static implementation coverage aligned', () => {
    expect([...MEILONG_PUBLIC_PAGE_KEYS].sort()).toEqual([...expectedCapabilities].sort())
    for (const file of staticPageFiles) {
      expect(existsSync(resolve(__dirname, '..', 'storefront', 'pages', file))).toBe(true)
    }
    for (const file of governedRouteFiles) {
      expect(existsSync(resolve(__dirname, '..', 'storefront', 'pages', file))).toBe(true)
    }
    for (const file of retiredRouteFiles) {
      expect(existsSync(resolve(__dirname, '..', 'storefront', 'pages', file))).toBe(false)
    }
  })
})
