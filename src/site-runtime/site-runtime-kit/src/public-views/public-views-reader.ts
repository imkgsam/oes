import type {
  LocalPublishedStore,
  PublicViewEnvelope,
  ResourceType,
  StoredPublishedResource
} from '../types'

export interface PublicViewListOptions {
  locale?: string
  cursor?: string
  limit?: number
}

export interface PublicViewListResult {
  items: PublicViewEnvelope[]
  nextCursor: string | null
}

export interface PublicResourceReader {
  list(options?: PublicViewListOptions): Promise<PublicViewListResult>
  getBySlug(slug: string, locale: string): Promise<PublicViewEnvelope | null>
}

// PublicViewsReader exposes stable local public view readers for storefront SSR and backend APIs.
export class PublicViewsReader {
  readonly products: PublicResourceReader
  readonly categories: PublicResourceReader
  readonly contents: PublicResourceReader
  readonly blogs: PublicResourceReader
  readonly news: PublicResourceReader

  constructor(private readonly store: LocalPublishedStore, private readonly siteId: string) {
    this.products = this.createResourceReader('product')
    this.categories = this.createResourceReader('category')
    this.contents = this.createResourceReader('content')
    this.blogs = this.createResourceReader('blog')
    this.news = this.createResourceReader('news')
  }

  // createResourceReader binds list and slug lookups to one P1 resource type.
  private createResourceReader(resourceType: ResourceType): PublicResourceReader {
    return {
      list: async (options = {}) => {
        const result = await this.store.listPublishedResources({
          siteId: this.siteId,
          resourceType,
          locale: options.locale,
          status: 'published',
          cursor: options.cursor,
          limit: options.limit
        })
        return {
          items: result.items.map(mapStoredResource),
          nextCursor: result.nextCursor
        }
      },
      getBySlug: async (slug, locale) => {
        const item = await this.store.getPublishedResourceBySlug({
          siteId: this.siteId,
          resourceType,
          slug,
          locale,
          status: 'published'
        })
        return item ? mapStoredResource(item) : null
      }
    }
  }
}

// mapStoredResource converts a local SQLite resource row into the package public view envelope.
export function mapStoredResource(resource: StoredPublishedResource): PublicViewEnvelope {
  return {
    siteId: resource.siteId,
    resourceType: resource.resourceType,
    resourceId: resource.resourceId,
    slug: resource.slug,
    locale: resource.locale,
    status: resource.status,
    publishVersion: resource.publishVersion,
    updatedAt: resource.updatedAt,
    payload: JSON.parse(resource.payloadJson)
  }
}
