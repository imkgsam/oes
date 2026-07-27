/** Identifies every authority dimension that permits one local ExecutionToken reuse. */
export type CertificateBoundExecutionTokenCacheKey = {
  readonly subject: string
  readonly principalType: 'HUMAN' | 'MACHINE' | 'DELEGATED'
  readonly actor?: string
  readonly delegationId?: string
  readonly tenantId?: string
  readonly orgId?: string
  readonly targetAudience: string
  readonly permissionCodes: readonly string[]
  readonly workloadIdentity: string
  readonly certificateThumbprint: string
  readonly sessionId?: string
  readonly authzVersion?: string | number
}

/** Stores the opaque token and its absolute epoch-second expiry. */
export type CachedExecutionToken = {
  readonly accessToken: string
  readonly expiresAt: number
}

/** Configures expiry behavior for the process-local certificate-bound token cache. */
export type CertificateBoundExecutionTokenCacheOptions = {
  readonly refreshMarginSeconds: number
  readonly now?: () => number
}

/** Reuses opaque ExecutionTokens only for an exact authority set and current leaf-certificate binding. */
export class CertificateBoundExecutionTokenCache {
  private readonly entries = new Map<string, Readonly<CachedExecutionToken>>()
  private readonly refreshMarginSeconds: number
  private readonly now: () => number

  constructor(options: CertificateBoundExecutionTokenCacheOptions) {
    if (
      !Number.isFinite(options.refreshMarginSeconds) ||
      options.refreshMarginSeconds < 0 ||
      !Number.isInteger(options.refreshMarginSeconds)
    ) {
      throw new Error('ExecutionToken cache refresh margin must be a non-negative integer')
    }
    this.refreshMarginSeconds = options.refreshMarginSeconds
    this.now = options.now ?? (() => Math.floor(Date.now() / 1000))
  }

  /** Stores one opaque token under its complete normalized authority and certificate key. */
  set(key: CertificateBoundExecutionTokenCacheKey, token: CachedExecutionToken): void {
    if (
      typeof token.accessToken !== 'string' ||
      token.accessToken.length === 0 ||
      !Number.isInteger(token.expiresAt) ||
      token.expiresAt <= this.now()
    ) {
      throw new Error('Cached ExecutionToken must be non-empty and unexpired')
    }
    this.entries.set(buildCacheKey(key), Object.freeze({ ...token }))
  }

  /** Returns a token only while it remains outside the configured refresh margin. */
  get(key: CertificateBoundExecutionTokenCacheKey): Readonly<CachedExecutionToken> | undefined {
    const cacheKey = buildCacheKey(key)
    const token = this.entries.get(cacheKey)
    if (token === undefined) {
      return undefined
    }
    if (token.expiresAt <= this.now() + this.refreshMarginSeconds) {
      this.entries.delete(cacheKey)
      return undefined
    }
    return token
  }

  /** Removes all process-local bearer material, for example during controlled shutdown. */
  clear(): void {
    this.entries.clear()
  }
}

/** Produces a stable exact-match key without omitting any frozen authority dimension. */
function buildCacheKey(key: CertificateBoundExecutionTokenCacheKey): string {
  const requiredStrings = [
    key.subject,
    key.principalType,
    key.targetAudience,
    key.workloadIdentity,
    key.certificateThumbprint
  ]
  if (requiredStrings.some((value) => typeof value !== 'string' || value.length === 0)) {
    throw new Error('ExecutionToken cache key contains an empty required binding')
  }
  if (!Array.isArray(key.permissionCodes)) {
    throw new Error('ExecutionToken cache permission codes must be an array')
  }

  const permissionCodes = [...new Set(key.permissionCodes.map(normalizePermissionCode))].sort()
  return JSON.stringify({
    subject: key.subject,
    principalType: key.principalType,
    actor: key.actor ?? null,
    delegationId: key.delegationId ?? null,
    tenantId: key.tenantId ?? null,
    orgId: key.orgId ?? null,
    targetAudience: key.targetAudience,
    permissionCodes,
    workloadIdentity: key.workloadIdentity,
    certificateThumbprint: key.certificateThumbprint,
    sessionId: key.sessionId ?? null,
    authzVersion: key.authzVersion ?? null
  })
}

/** Normalizes a permission code while rejecting ambiguous blank cache bindings. */
function normalizePermissionCode(code: string): string {
  if (typeof code !== 'string' || code.trim().length === 0) {
    throw new Error('ExecutionToken cache permission codes must be non-empty strings')
  }
  return code.trim()
}
