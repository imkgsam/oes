/** SiteMediaLifecycleOperation records stable idempotency identity for lifecycle commands. */
export type SiteMediaOperationKind = 'TAKEDOWN_PURGE' | 'DELETE'
export type SiteMediaOperationStatus = 'PENDING' | 'RETRY' | 'PROCESSING' | 'CONFIRMED'
/** SiteMediaLifecycleOperation carries immutable purge target and durable retry state. */
export class SiteMediaLifecycleOperation {
  constructor(readonly operationId: string, readonly tenantId: string, readonly assetId: string, readonly idempotencyKey: string, readonly requestHash: string, readonly kind: SiteMediaOperationKind = 'TAKEDOWN_PURGE', readonly status: SiteMediaOperationStatus = 'PENDING', readonly immutableTargetUrl: string | null = null, readonly attempts = 0, readonly nextAttemptAt: Date = new Date(), readonly providerRequestId: string | null = null, readonly lastSafeError: string | null = null, readonly confirmedAt: Date | null = null, readonly leaseExpiresAt: Date | null = null) {}
}
