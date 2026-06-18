import { sanitizeSiteHtml } from '../content/site-html-sanitizer'

export type SitePublicResourceType = 'product' | 'category' | 'content' | 'blog' | 'news'
export type SitePublicViewStatus = 'published' | 'unpublished' | 'deleted' | 'disabled' | 'draft_preview'

export interface SitePublicViewEnvelope<TPayload extends Record<string, unknown>> {
  site_id: string
  resource_type: SitePublicResourceType
  resource_id: string
  locale: string
  slug: string
  status: SitePublicViewStatus
  publish_version: number
  updated_at: string
  payload: TPayload
}

export interface ProductPublicFacts {
  productId: string
  summary?: string | null
  model?: string | null
  brand?: string | null
  categoryIds?: string[]
  images?: ProductPublicImage[]
  specs?: ProductPublicSpec[]
  [key: string]: unknown
}

export interface ProductPublicImage {
  url: string
  alt: string
  role: 'primary' | 'gallery' | 'seo'
}

export interface ProductPublicSpec {
  name: string
  value: string
  unit?: string | null
  group?: string | null
}

export interface BuildProductPublicViewInput {
  siteId: string
  productId: string
  locale: string
  slug: string
  displayTitle: string
  displayDescription: string
  seoTitle: string
  seoDescription: string
  seoImage?: string | null
  imageOverride?: string | null
  publishVersion: number
  updatedAt: Date
  facts: ProductPublicFacts
}

export interface BuildCategoryPublicViewInput {
  siteId: string
  categoryId: string
  parentCategoryId?: string | null
  locale: string
  slug: string
  displayTitle: string
  description?: string | null
  image?: string | null
  sortOrder?: number | null
  seoTitle: string
  seoDescription: string
  seoImage?: string | null
  publishStatus: string
  publishVersion: number
  updatedAt: Date
}

export interface BuildContentPublicViewInput {
  siteId: string
  contentId: string
  locale: string
  slug: string
  title: string
  bodyHtml: string
  summary?: string | null
  coverImage?: string | null
  author?: string | null
  tags?: string[]
  seoTitle: string
  seoDescription: string
  seoImage?: string | null
  publishedAt?: Date | null
  publishVersion: number
  updatedAt: Date
}

/** buildProductPublicView combines product public facts with site-owned display configuration. */
export function buildProductPublicView(
  input: BuildProductPublicViewInput
): SitePublicViewEnvelope<Record<string, unknown>> {
  const images = input.facts.images?.map((image, index) => ({
    ...image,
    url: index === 0 && input.imageOverride ? input.imageOverride : image.url
  }))

  return {
    site_id: input.siteId,
    resource_type: 'product',
    resource_id: input.productId,
    locale: input.locale,
    slug: input.slug,
    status: 'published',
    publish_version: input.publishVersion,
    updated_at: input.updatedAt.toISOString(),
    payload: {
      product_id: input.productId,
      display_title: input.displayTitle,
      display_description: input.displayDescription,
      summary: input.facts.summary ?? null,
      model: input.facts.model ?? null,
      brand: input.facts.brand ?? null,
      category_ids: input.facts.categoryIds ?? [],
      images: images ?? [],
      specs: input.facts.specs ?? [],
      seo: {
        title: input.seoTitle,
        description: input.seoDescription,
        image: input.seoImage ?? null,
        canonical_url: null
      }
    }
  }
}

/** buildCategoryPublicView maps a site-owned category projection into a runtime public view. */
export function buildCategoryPublicView(
  input: BuildCategoryPublicViewInput
): SitePublicViewEnvelope<Record<string, unknown>> {
  return {
    site_id: input.siteId,
    resource_type: 'category',
    resource_id: input.categoryId,
    locale: input.locale,
    slug: input.slug,
    status: publicStatusFromPublishStatus(input.publishStatus),
    publish_version: input.publishVersion,
    updated_at: input.updatedAt.toISOString(),
    payload: {
      category_id: input.categoryId,
      parent_category_id: input.parentCategoryId ?? null,
      display_title: input.displayTitle,
      description: input.description ?? null,
      image: input.image ?? null,
      sort_order: input.sortOrder ?? 0,
      seo: {
        title: input.seoTitle,
        description: input.seoDescription,
        image: input.seoImage ?? null
      }
    }
  }
}

/** buildBlogPublicView creates one sanitized BlogPublicView envelope from site-scoped content. */
export function buildBlogPublicView(
  input: BuildContentPublicViewInput
): SitePublicViewEnvelope<Record<string, unknown>> {
  return buildContentPublicView('blog', input)
}

/** publicStatusFromPublishStatus maps editable publication state into runtime public-view state. */
function publicStatusFromPublishStatus(publishStatus: string): SitePublicViewStatus {
  return publishStatus === 'unpublished' ? 'unpublished' : 'published'
}

/** buildNewsPublicView creates one sanitized NewsPublicView envelope from site-scoped content. */
export function buildNewsPublicView(
  input: BuildContentPublicViewInput
): SitePublicViewEnvelope<Record<string, unknown>> {
  return buildContentPublicView('news', input)
}

/** buildContentPublicView maps one content locale version into a public view payload. */
function buildContentPublicView(
  resourceType: 'blog' | 'news',
  input: BuildContentPublicViewInput
): SitePublicViewEnvelope<Record<string, unknown>> {
  return {
    site_id: input.siteId,
    resource_type: resourceType,
    resource_id: input.contentId,
    locale: input.locale,
    slug: input.slug,
    status: 'published',
    publish_version: input.publishVersion,
    updated_at: input.updatedAt.toISOString(),
    payload: {
      content_id: input.contentId,
      title: input.title,
      summary: input.summary ?? null,
      cover_image: input.coverImage ?? null,
      author: input.author ?? null,
      tags: input.tags ?? [],
      body_html: sanitizeSiteHtml(input.bodyHtml),
      published_at: input.publishedAt?.toISOString() ?? null,
      seo: {
        title: input.seoTitle,
        description: input.seoDescription,
        image: input.seoImage ?? null
      }
    }
  }
}
