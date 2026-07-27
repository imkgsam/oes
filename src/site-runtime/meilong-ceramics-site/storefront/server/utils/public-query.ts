// readOptionalSingleQueryString accepts only a missing value or one H3 query string before Runtime dispatch.
export function readOptionalSingleQueryString(
  query: Record<string, unknown>,
  key: string
): string | undefined {
  const value = query[key]
  if (value === undefined) {
    return undefined
  }
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid ${key} query parameter`
    })
  }
  return value
}
