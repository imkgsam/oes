export type CompletenessLocaleStatus = 'active' | 'preparing' | 'disabled'

export interface CompletenessLocale {
  locale: string
  status: CompletenessLocaleStatus
}

export interface CompletenessProductPublication {
  productId: string
  locale: string
  slug: string
  displayTitle: string
  displayDescription: string
}

export interface CompletenessContentVersion {
  contentId: string
  contentType: 'blog' | 'news'
  locale: string
  slug: string
  title: string
  bodyHtml: string
}

export interface LocaleCompletenessInput {
  locales: CompletenessLocale[]
  productPublications: CompletenessProductPublication[]
  contentVersions: CompletenessContentVersion[]
}

/** SiteLocaleCompletenessError reports active-locale gaps before sync can publish views. */
export class SiteLocaleCompletenessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SiteLocaleCompletenessError'
  }
}

/** checkActiveLocaleCompleteness validates active locales while ignoring preparing or disabled locales. */
export function checkActiveLocaleCompleteness(input: LocaleCompletenessInput): void {
  const activeLocales = input.locales
    .filter((locale) => locale.status === 'active')
    .map((locale) => locale.locale)

  for (const locale of activeLocales) {
    for (const publication of input.productPublications.filter((product) => product.locale === locale)) {
      assertNonBlank(publication.slug, `product ${publication.productId} slug`)
      assertNonBlank(publication.displayTitle, `product ${publication.productId} display title`)
      assertNonBlank(publication.displayDescription, `product ${publication.productId} display description`)
    }

    for (const version of input.contentVersions.filter((content) => content.locale === locale)) {
      assertNonBlank(version.slug, `${version.contentType} ${version.contentId} slug`)
      assertNonBlank(version.title, `${version.contentType} ${version.contentId} title`)
      assertNonBlank(version.bodyHtml, `${version.contentType} ${version.contentId} body`)
    }
  }
}

/** assertNonBlank raises a completeness error for missing public-view required fields. */
function assertNonBlank(value: string, field: string): void {
  if (!value?.trim()) {
    throw new SiteLocaleCompletenessError(`${field} is required for active locale sync`)
  }
}
