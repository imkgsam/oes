const DEFAULT_TENANT_WEB_BASE_URL = 'http://localhost:5771'

// Resolves tenant-web deep links returned by the BFF into browser-openable absolute URLs.
export function resolveTenantWebUrl(pathOrUrl: string, baseUrl = defaultTenantWebBaseUrl()): string {
  const trimmed = pathOrUrl.trim()
  if (!trimmed) {
    return ''
  }

  try {
    return new URL(trimmed).href
  } catch {
    return new URL(trimmed.startsWith('/') ? trimmed : `/${trimmed}`, normalizeBaseUrl(baseUrl)).href
  }
}

// Returns the configured tenant-web base URL used by the extension runtime and side panel.
export function defaultTenantWebBaseUrl(): string {
  return import.meta.env.VITE_OES_TENANT_WEB_BASE_URL?.trim() || DEFAULT_TENANT_WEB_BASE_URL
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '') || DEFAULT_TENANT_WEB_BASE_URL
}
