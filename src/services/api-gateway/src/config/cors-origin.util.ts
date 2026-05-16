/** Resolves Gateway CORS origin config so wildcard development mode still works with credentialed requests. */
export function resolveCorsOrigin(origins: string[]) {
  if (origins.includes('*')) {
    return true
  }

  return origins
}
