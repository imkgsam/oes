import { Injectable } from '@nestjs/common'
import type { SiteExposurePublication } from '@oes/site-runtime-kit'

export interface SiteLocaleConfig {
  locale: string
  isDefault: boolean
  routePrefix: string
}

export interface PublicSiteConfig {
  siteName: string
  publicBaseUrl: string
  committedPublishVersion: number
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
  // getPublicConfig combines local public identity with the exact committed locale publication.
  async getPublicConfig(publication: SiteExposurePublication): Promise<PublicSiteConfig> {
    return {
      siteName: process.env.SITE_NAME ?? 'Meilong Ceramics',
      publicBaseUrl: this.getPublicBaseUrl(),
      committedPublishVersion: publication.publishVersion,
      defaultLocale: publication.defaultLocale,
      activeLocales: publication.activeLocales.map((locale) => ({
        locale,
        isDefault: locale === publication.defaultLocale,
        routePrefix: locale === publication.defaultLocale ? '' : `/${locale}`
      })),
      preview: {
        indexing: 'noindex',
        cachePolicy: 'no-store'
      }
    }
  }

  // getPublicBaseUrl returns the public-safe canonical origin without consulting OES or governance storage.
  getPublicBaseUrl(): string {
    return trimTrailingSlash(
      process.env.SITE_PUBLIC_BASE_URL ?? 'https://meilong-ceramics.com'
    )
  }

  // resolvePublicPath applies the committed default-locale prefix convention to one resource route.
  resolvePublicPath(
    publication: SiteExposurePublication,
    locale: string,
    collection: string,
    slug: string
  ): string {
    const prefix = locale === publication.defaultLocale ? '' : `/${locale}`
    const routeCollection = collection === 'blog' ? 'blogs' : collection
    return `${prefix}/${routeCollection}/${slug}`
  }

  // resolveContentCategoryArchivePath applies the Blog / News Content Category archive route convention.
  resolveContentCategoryArchivePath(
    publication: SiteExposurePublication,
    locale: string,
    contentType: 'blog' | 'news',
    slug: string
  ): string {
    const prefix = locale === publication.defaultLocale ? '' : `/${locale}`
    const routeCollection = contentType === 'blog' ? 'blogs' : contentType
    return `${prefix}/${routeCollection}/categories/${slug}`
  }
}

// trimTrailingSlash normalizes configured public origins for canonical URL composition.
function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}
