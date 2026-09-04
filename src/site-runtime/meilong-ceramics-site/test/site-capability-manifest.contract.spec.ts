import { MEILONG_SITE_CAPABILITY_MANIFEST } from '../runtime/src/site-capability-manifest'
import { MEILONG_RUNTIME_MODULE_OPTIONS } from '../runtime/src/site-runtime-options'

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
  })
})
