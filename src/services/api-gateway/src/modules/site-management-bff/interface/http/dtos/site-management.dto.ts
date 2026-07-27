export interface CreateSiteDto {
  siteName: string
  siteType: string
  brandId?: string
  regionCode?: string
  channelCode?: string
  defaultLocale: string
  primaryDomain?: string
  previewBaseUrl?: string
}

export interface SiteLocaleOptionDto {
  locale: string
  nativeName: string
}

export interface IssuePreviewTokenDto {
  resourceType: 'product' | 'blog' | 'news'
  resourceId: string
  locale: string
}

export interface UpdateSiteSettingsDto {
  siteName?: string
  primaryDomain?: string
  previewBaseUrl?: string
  webhookUrl?: string
  runtimeStatusUrl?: string
  allowedOrigins?: string[]
}

export interface AddPreparingLocaleDto {
  locale: string
}

export interface GenerateSiteCredentialDto {
  scopes?: string[]
}

export interface AddProductsToSiteDto {
  productIds: string[]
  locales: string[]
  categoryIds?: string[]
}

export interface UpdateSiteProductPublicationDto {
  publicationId?: string
  siteId?: string
  productId?: string
  locale?: string
  slug: string
  displayTitle: string
  displayDescription?: string
  seoTitle: string
  seoDescription?: string
  seoImage?: string
  imageOverride?: string
  categoryIds?: string[]
  publishStatus?: string
  syncStatus?: string
}

export interface CreateSiteCategoryDto {
  parentCategoryId?: string
  sourceCategoryId?: string
  locale: string
  slug: string
  displayTitle: string
  description?: string
  image?: string
  sortOrder?: number
  seoTitle: string
  seoDescription?: string
  seoImage?: string
}

export interface UpdateSiteCategoryDto extends CreateSiteCategoryDto {
  categoryId?: string
  siteId?: string
  publishStatus?: string
  syncStatus?: string
}

export interface CreateSiteContentDto {
  contentType: 'blog' | 'news'
}

export interface UpdateSiteContentLocaleVersionDto {
  contentId: string
  locale: string
  slug: string
  title: string
  summary?: string
  coverImage?: string
  coverImageAlt?: string
  author?: string
  tags?: string[]
  categoryIds?: string[]
  bodyHtml: string
  seoTitle: string
  seoDescription: string
  seoImage?: string
  publishedAt?: string
  status?: string
}

export interface CreateContentCategoryDto {
  sortOrder?: number
  initialLocaleVersion: ContentCategoryLocaleVersionDto
}

export interface ContentCategoryLocaleVersionDto {
  categoryId?: string
  locale: string
  slug: string
  displayName: string
  archiveIntro?: string
  archiveLabel?: string
  seoTitle?: string
  seoDescription?: string
  seoImage?: string
}

export type UpdateContentCategoryLocaleVersionDto = ContentCategoryLocaleVersionDto

export interface UpdateFaqCategoryLocaleVersionDto { categoryId: string; locale: string; title: string; anchorKey: string; sortOrder: number }
export interface CreateFaqEntryDto { categoryId: string }
export interface UpdateFaqEntryLocaleVersionDto { entryId: string; locale: string; question: string; answerHtml: string; sortOrder: number }
