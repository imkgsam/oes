const allowedPrintImageOrigin = 'https://kohler.scene7.com'
const allowedPrintImagePathPrefix = '/is/image/PAWEB/'

// printImage proxies approved product images through the storefront origin for reliable browser PDF printing.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const src = typeof query.src === 'string' ? query.src : ''

  let imageUrl: URL
  try {
    imageUrl = new URL(src)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid print image URL' })
  }

  const isAllowedImage =
    imageUrl.origin === allowedPrintImageOrigin &&
    imageUrl.pathname.startsWith(allowedPrintImagePathPrefix)

  if (!isAllowedImage) {
    throw createError({ statusCode: 403, statusMessage: 'Print image URL is not allowed' })
  }

  const response = await fetch(imageUrl.toString(), {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }
  })

  if (!response.ok) {
    throw createError({ statusCode: response.status, statusMessage: 'Print image fetch failed' })
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  if (!contentType.startsWith('image/')) {
    throw createError({ statusCode: 415, statusMessage: 'Print image response is not an image' })
  }

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')

  return new Uint8Array(await response.arrayBuffer())
})
