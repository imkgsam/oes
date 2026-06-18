import { Injectable } from '@nestjs/common'

export interface SiteLocaleConfig {
  locale: string
  isDefault: boolean
  routePrefix: string
}

export interface PublicSiteConfig {
  siteName: string
  publicBaseUrl: string
  defaultLocale: string
  activeLocales: SiteLocaleConfig[]
  preview: {
    indexing: 'noindex'
    cachePolicy: 'no-store'
  }
}

// SiteConfigService exposes public-safe site identity and locale routing configuration to Storefront SSR.
@Injectable()
export class SiteConfigService {
  private readonly defaultLocale = process.env.SITE_DEFAULT_LOCALE ?? 'en-US'
  private readonly activeLocales = normalizeLocaleList(
    process.env.SITE_ACTIVE_LOCALES,
    this.defaultLocale
  )

  // getPublicConfig returns SEO-safe site config without OES credentials or signing material.
  getPublicConfig(): PublicSiteConfig {
    return {
      siteName: process.env.SITE_NAME ?? 'Meilong Ceramics',
      publicBaseUrl: trimTrailingSlash(
        process.env.SITE_PUBLIC_BASE_URL ?? 'https://meilong-ceramics.com'
      ),
      defaultLocale: this.defaultLocale,
      activeLocales: this.activeLocales.map((locale) => ({
        locale,
        isDefault: locale === this.defaultLocale,
        routePrefix: locale === this.defaultLocale ? '' : `/${locale}`
      })),
      preview: {
        indexing: 'noindex',
        cachePolicy: 'no-store'
      }
    }
  }

  // isActiveLocale protects route and sitemap generation from preparing or disabled locales.
  isActiveLocale(locale: string): boolean {
    return this.activeLocales.includes(locale)
  }

  // resolvePublicPath applies the P1 default-English no-prefix and non-default locale prefix convention.
  resolvePublicPath(locale: string, collection: string, slug: string): string {
    const prefix = locale === this.defaultLocale ? '' : `/${locale}`
    return `${prefix}/${collection}/${slug}`
  }
}

// normalizeLocaleList guarantees the default locale is active and removes empty duplicate values.
function normalizeLocaleList(rawLocales: string | undefined, defaultLocale: string): string[] {
  const locales = (rawLocales ?? defaultLocale)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return Array.from(new Set([defaultLocale, ...locales]))
}

// trimTrailingSlash normalizes configured public origins for canonical URL composition.
function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}
