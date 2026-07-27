export type SiteContentType = 'blog' | 'news'
export interface ContentCategoryLocaleVersionPolicyRecord {
  locale: string
  slug: string
  displayName: string
  lastPublishedRevision?: number | null
}

export interface ContentCategoryPolicyRecord {
  categoryId: string
  deletedAt?: Date | string | null
  localeVersions: ContentCategoryLocaleVersionPolicyRecord[]
}

export interface AssertContentCategoryReferencesValidInput {
  contentType: SiteContentType
  targetLocale: string
  referencedCategoryIds: string[]
  categories: ContentCategoryPolicyRecord[]
}

/** ContentCategoryReferenceError reports invalid Blog/News category references before sync. */
export class ContentCategoryReferenceError extends Error {
  constructor(readonly issues: string[]) {
    super(`invalid content category references: ${issues.join('; ')}`)
  }
}

/** assertContentCategoryReferencesValid validates references only for the resource locale being published. */
export function assertContentCategoryReferencesValid(input: AssertContentCategoryReferencesValidInput): void {
  const issues: string[] = []
  const categoriesById = new Map(input.categories.map((category) => [category.categoryId, category]))

  for (const categoryId of input.referencedCategoryIds) {
    const category = categoriesById.get(categoryId)
    if (!category) {
      issues.push(`category ${categoryId} does not exist`)
      continue
    }
    if (category.deletedAt) {
      issues.push(`category ${categoryId} is deleted`)
    }
    const versionsByLocale = new Map(category.localeVersions.map((version) => [version.locale, version]))
    const version = versionsByLocale.get(input.targetLocale)
    if (!isCompleteCategoryLocaleVersion(version)) {
      issues.push(`category ${categoryId} is incomplete for locale ${input.targetLocale}`)
    }
  }

  if (issues.length > 0) {
    throw new ContentCategoryReferenceError(issues)
  }
}

/** isCompleteCategoryLocaleVersion requires a same-locale published Category revision before Article publication. */
function isCompleteCategoryLocaleVersion(version?: ContentCategoryLocaleVersionPolicyRecord): boolean {
  return Boolean(
    version?.locale.trim() &&
    version.slug.trim() &&
    version.displayName.trim() &&
    version.lastPublishedRevision &&
    version.lastPublishedRevision > 0
  )
}
