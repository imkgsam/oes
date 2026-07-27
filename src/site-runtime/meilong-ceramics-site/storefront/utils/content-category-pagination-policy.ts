// contentCategoryPaginationPolicy is the Storefront-only truth for Blog and News Category page capacities.
export const CONTENT_CATEGORY_PAGINATION_POLICY = {
  blog: { pageSize: 9 },
  news: { pageSize: 8 }
} as const

export const BLOG_CATEGORY_PAGE_SIZE = CONTENT_CATEGORY_PAGINATION_POLICY.blog.pageSize
export const NEWS_CATEGORY_PAGE_SIZE = CONTENT_CATEGORY_PAGINATION_POLICY.news.pageSize
