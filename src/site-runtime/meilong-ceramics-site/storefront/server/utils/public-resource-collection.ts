export type GenericPublicListCollection = 'blog' | 'news'
export type GenericPublicDetailCollection = 'products' | 'blog' | 'news'

const genericPublicListCollections = new Set<string>(['blog', 'news'])
const genericPublicDetailCollections = new Set<string>(['products', 'blog', 'news'])

// requireGenericPublicListCollection keeps retired and operation-specific namespaces out of the generic list proxy.
export function requireGenericPublicListCollection(
  value: string | undefined
): GenericPublicListCollection {
  if (!value || !genericPublicListCollections.has(value)) {
    throw createError({ statusCode: 404, statusMessage: 'Unsupported public collection' })
  }
  return value as GenericPublicListCollection
}

// requireGenericPublicDetailCollection keeps product detail without exposing categories through the generic detail proxy.
export function requireGenericPublicDetailCollection(
  value: string | undefined
): GenericPublicDetailCollection {
  if (!value || !genericPublicDetailCollections.has(value)) {
    throw createError({ statusCode: 404, statusMessage: 'Unsupported public collection' })
  }
  return value as GenericPublicDetailCollection
}
