export const INSPIRATION_CATEGORY_SLUG = {
  PETS: 'pets',
  KIDS: 'kids',
  TETRO: 'tetro'
} as const

export type InspirationCategorySlug =
  (typeof INSPIRATION_CATEGORY_SLUG)[keyof typeof INSPIRATION_CATEGORY_SLUG]
export type InspirationFilter = 'all' | InspirationCategorySlug

export interface InspirationCategoryInventoryItem {
  slug: InspirationCategorySlug
  label: string
}

export interface InspirationFilterInventoryItem {
  slug: InspirationFilter
  label: string
  href: string
}

// INSPIRATION_CATEGORY_INVENTORY owns the stable public Inspiration Category identities used by pages, navigation, and sitemap.
export const INSPIRATION_CATEGORY_INVENTORY = [
  { slug: INSPIRATION_CATEGORY_SLUG.PETS, label: 'Pets' },
  { slug: INSPIRATION_CATEGORY_SLUG.KIDS, label: 'Kids' },
  { slug: INSPIRATION_CATEGORY_SLUG.TETRO, label: 'Tetro' }
] as const satisfies readonly InspirationCategoryInventoryItem[]

const inspirationCategorySlugSet = new Set<InspirationCategorySlug>(
  INSPIRATION_CATEGORY_INVENTORY.map(({ slug }) => slug)
)

// inspirationCategoryPath maps the root filter and every stable Category identity to its canonical Storefront path.
export function inspirationCategoryPath(category: InspirationFilter): string {
  return category === 'all' ? '/inspirations' : `/inspirations/category/${category}`
}

// isInspirationCategorySlug narrows a dynamic route value to one inventory-backed public Category identity.
export function isInspirationCategorySlug(value: string): value is InspirationCategorySlug {
  return inspirationCategorySlugSet.has(value as InspirationCategorySlug)
}

// INSPIRATION_FILTER_INVENTORY adds the root filter without creating a second routed Category slug list.
export const INSPIRATION_FILTER_INVENTORY: readonly InspirationFilterInventoryItem[] = [
  { slug: 'all', label: 'All', href: inspirationCategoryPath('all') },
  ...INSPIRATION_CATEGORY_INVENTORY.map(({ slug, label }) => ({
    slug,
    label,
    href: inspirationCategoryPath(slug)
  }))
]
