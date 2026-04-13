export interface HttpRequestLike {
  user?: unknown
  headers?: Record<string, string | string[] | undefined>
  header?: (name: string) => string | string[] | undefined
}

export function getHeaderValue(
  request: HttpRequestLike,
  name: string
): string | undefined {
  const directValue = request.header?.(name)
  if (typeof directValue === 'string') {
    return directValue
  }

  if (Array.isArray(directValue)) {
    return directValue[0]
  }

  const headersValue = request.headers?.[name] ?? request.headers?.[name.toLowerCase()]
  if (typeof headersValue === 'string') {
    return headersValue
  }

  if (Array.isArray(headersValue)) {
    return headersValue[0]
  }

  return undefined
}
