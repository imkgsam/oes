const DEFAULT_TENANT_WEB_NAMESPACE = 'oes-tenant-web'

// Resolves the tenant-web persistence namespace consistently across app bootstrap and request-time token recovery.
export function resolveTenantWebNamespace(overrides?: {
  appVersion?: string
  namespace?: string
  prod?: boolean
}) {
  const namespace = `${overrides?.namespace ?? import.meta.env.VITE_APP_NAMESPACE ?? DEFAULT_TENANT_WEB_NAMESPACE}`.trim()
  const appVersion = `${overrides?.appVersion ?? import.meta.env.VITE_APP_VERSION ?? ''}`.trim()
  const isProd = overrides?.prod ?? import.meta.env.PROD
  const env = isProd ? 'prod' : 'dev'

  if (!namespace || !appVersion) {
    return null
  }

  return `${namespace}-${appVersion}-${env}`
}

// Returns the legacy namespace key that older builds produced before VITE_APP_NAMESPACE was defined.
export function resolveLegacyUndefinedNamespace(overrides?: {
  appVersion?: string
  prod?: boolean
}) {
  const appVersion = `${overrides?.appVersion ?? import.meta.env.VITE_APP_VERSION ?? ''}`.trim()
  const isProd = overrides?.prod ?? import.meta.env.PROD
  const env = isProd ? 'prod' : 'dev'

  if (!appVersion) {
    return null
  }

  return `undefined-${appVersion}-${env}`
}
