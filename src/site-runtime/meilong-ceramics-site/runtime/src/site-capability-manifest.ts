import type { SiteCapabilityManifest } from '@oes/site-runtime-kit'

const ENGLISH_ONLY = ['en-US'] as const

// MEILONG_SITE_CAPABILITY_MANIFEST declares the complete stable page identity and actual locale surface implemented by this Storefront.
export const MEILONG_SITE_CAPABILITY_MANIFEST = {
  pages: [
    { pageKey: 'ABOUT', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'BLOG_CATEGORY', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'BLOG_DETAIL', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'BLOG_LIST', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'COLLECTION_DETAIL', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'COLLECTION_LIST', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'CONTACT', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'FAQ', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'HOME', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'INSPIRATION', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'INSPIRATION_CATEGORY', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'NEWS_CATEGORY', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'NEWS_DETAIL', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'NEWS_LIST', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'PRIVACY_POLICY', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'PRODUCT_DETAIL', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'RETURNS_REFUNDS', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'SEARCH', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'SERIES', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'SHIPPING_DELIVERY', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'TERMS_CONDITIONS', supportedLocales: ENGLISH_ONLY },
    { pageKey: 'WARRANTY', supportedLocales: ENGLISH_ONLY }
  ]
} as const satisfies SiteCapabilityManifest
