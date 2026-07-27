const allowedReferenceImageSources = [
  { origin: 'https://www.westelm.com', pathPrefix: '/netstorage/images/edam/' },
  { origin: 'https://assets.weimgs.com', pathPrefix: '/weimgs/rk/images/wcm/products/' },
  { origin: 'https://edge.curalate.com', pathPrefix: '/v1/img/' },
  { origin: 'https://images.pexels.com', pathPrefix: '/photos/' }
]
const referencePageUrl = 'https://www.westelm.com/shop-by-style/kids/'

// proxyReferenceImage serves only allowlisted inspiration fixtures with the referer required by their source hosts.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sourceUrl = typeof query.src === 'string' ? query.src : ''

  let imageUrl: URL
  try {
    imageUrl = new URL(sourceUrl)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid reference image URL' })
  }

  const isAllowedReferenceImage = allowedReferenceImageSources.some(
    (source) => imageUrl.origin === source.origin && imageUrl.pathname.startsWith(source.pathPrefix)
  )
  if (!isAllowedReferenceImage) {
    throw createError({ statusCode: 403, statusMessage: 'Reference image URL is not allowed' })
  }

  const response = await fetch(imageUrl.toString(), {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      Referer: referencePageUrl,
      'User-Agent': 'Mozilla/5.0 (compatible; MeilongCeramicsReferenceFixture/1.0)'
    }
  })
  if (!response.ok) {
    throw createError({ statusCode: response.status, statusMessage: 'Reference image fetch failed' })
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  if (!contentType.startsWith('image/')) {
    throw createError({ statusCode: 415, statusMessage: 'Reference image response is not an image' })
  }

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')

  return new Uint8Array(await response.arrayBuffer())
})
