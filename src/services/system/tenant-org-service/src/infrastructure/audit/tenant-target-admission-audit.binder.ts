import { ExecutionContext, Injectable, Logger } from '@nestjs/common'
import type { TenantTargetAuditBinding } from '@oes/common/authorization'

export type TenantOrgTargetAuditStage =
  | 'TRUSTED_EXECUTION'
  | 'TARGET_METHOD_AUTHORITY'
  | 'TARGET_SELECTOR_ADMISSION'
  | 'TARGET_AUDIT_BINDING'

export type TenantOrgTargetDenialReason =
  | 'TRUSTED_EXECUTION_DENIED'
  | 'METHOD_DECLARATION_INVALID'
  | 'WORKLOAD_OR_CODE_MISMATCH'
  | 'SELECTOR_INVALID'
  | 'SELECTOR_SCOPE_MISMATCH'
  | 'AUDIT_BINDING_FAILED'
  | 'TARGET_ADMISSION_DENIED'

export type TenantOrgTargetDenialAuditBinding = Readonly<{
  methodReference: string
  requestId: string | null
  traceId: string | null
  stage: TenantOrgTargetAuditStage
  stableReason: TenantOrgTargetDenialReason
}>

/** TenantOrgTenantTargetAuditBinder records credential-free admitted and denied target decisions. */
@Injectable()
export class TenantOrgTenantTargetAuditBinder {
  private readonly logger = new Logger(TenantOrgTenantTargetAuditBinder.name)

  /** Persists one admitted selector fact with its exact target method reference. */
  bindAdmitted(
    methodReference: string,
    { decision, requestId, traceId }: TenantTargetAuditBinding
  ): boolean {
    this.logger.log({
      eventType: 'TENANT_TARGET_ADMISSION',
      result: 'SUCCEEDED',
      stage: 'TARGET_SELECTOR_ADMISSION',
      stableReason: 'ADMITTED',
      service: 'tenant-org-service',
      module: 'tenant-target-admission',
      targetMethodReference: methodReference,
      requestId,
      traceId,
      decisionRef: decision.tokenId,
      trustedSubject: decision.subject,
      subjectScope: decision.subjectScope,
      subjectTenantId: decision.subjectTenantId ?? null,
      reauthorizedTenantSelector: decision.selector,
      selectorField: decision.selectorField,
      workloadIdentity: decision.workloadIdentity,
      declarationKind: decision.declarationKind,
      permissionCode: decision.permissionCode ?? null,
      range: decision.range ?? null
    })
    return true
  }

  /** Persists one stable denial fact without copying credentials or untrusted selector material. */
  bindDenied(input: TenantOrgTargetDenialAuditBinding): boolean {
    this.logger.warn({
      eventType: 'TENANT_TARGET_ADMISSION',
      result: 'DENIED',
      service: 'tenant-org-service',
      module: 'tenant-target-admission',
      targetMethodReference: input.methodReference,
      requestId: input.requestId,
      traceId: input.traceId,
      stage: input.stage,
      stableReason: input.stableReason
    })
    return true
  }
}

/** Reads audit correlation from verified context first and raw gRPC metadata second. */
export function readTenantOrgTargetAuditCorrelation(
  context: ExecutionContext,
  verified?: { readonly requestId?: string; readonly traceId?: string }
): { readonly requestId: string | null; readonly traceId: string | null } {
  const metadata = context.switchToRpc().getContext() as {
    get?: (key: string) => readonly unknown[]
  }
  return {
    requestId: verified?.requestId ?? readMetadataString(metadata, 'x-request-id'),
    traceId: verified?.traceId ?? readMetadataString(metadata, 'x-trace-id')
  }
}

/** Reads one exact string-valued metadata element without serializing credential carriers. */
function readMetadataString(
  metadata: { readonly get?: (key: string) => readonly unknown[] },
  key: string
): string | null {
  try {
    const values = metadata?.get?.(key)
    return Array.isArray(values) && values.length === 1 && typeof values[0] === 'string'
      ? values[0]
      : null
  } catch {
    return null
  }
}
