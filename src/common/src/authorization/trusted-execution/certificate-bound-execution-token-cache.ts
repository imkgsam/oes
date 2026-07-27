import { certificateThumbprint } from './execution-token-verifier'

export interface CachedExecutionToken {
  token: string
  expiresAtUnixSeconds: number
  audience: string
  permissionCodes: readonly string[]
  certificateDer: Uint8Array
  execution: ExecutionTokenCacheExecution
}

/** Identifies the immutable execution facts that must not cross-reuse a bearer token within one workload. */
export interface ExecutionTokenCacheExecution {
  subject: string
  principalType: string
  tenantId: string
  orgId?: string
  delegationId?: string
  sessionId?: string
}

/** Stores short-lived issued credentials only in process memory and keys every entry by the current certificate binding. */
export class CertificateBoundExecutionTokenCache {
  private readonly entries = new Map<string, { token: string; expiresAtUnixSeconds: number }>()

  constructor(private readonly now: () => number = Date.now) {}

  /** Retrieves a still-valid token only when target audience, normalized permissions, and leaf certificate all match. */
  get(
    audience: string,
    permissionCodes: readonly string[],
    certificateDer: Uint8Array,
    execution: ExecutionTokenCacheExecution
  ): string | undefined {
    const key = cacheKey(audience, permissionCodes, certificateDer, execution)
    const entry = this.entries.get(key)
    if (!entry) {
      return undefined
    }
    if (entry.expiresAtUnixSeconds <= Math.floor(this.now() / 1_000)) {
      this.entries.delete(key)
      return undefined
    }
    return entry.token
  }

  /** Caches an issued token under its exact certificate-bound execution request dimensions. */
  put(token: CachedExecutionToken): void {
    this.entries.set(
      cacheKey(token.audience, token.permissionCodes, token.certificateDer, token.execution),
      {
        token: token.token,
        expiresAtUnixSeconds: token.expiresAtUnixSeconds
      }
    )
  }
}

/** Forms a stable local-only cache key without ever persisting or sharing bearer credentials. */
function cacheKey(
  audience: string,
  permissionCodes: readonly string[],
  certificateDer: Uint8Array,
  execution: ExecutionTokenCacheExecution
): string {
  return JSON.stringify([
    audience,
    [...new Set(permissionCodes)].sort(),
    certificateThumbprint(certificateDer),
    execution.subject,
    execution.principalType,
    execution.tenantId,
    execution.orgId ?? '',
    execution.delegationId ?? '',
    execution.sessionId ?? ''
  ])
}
