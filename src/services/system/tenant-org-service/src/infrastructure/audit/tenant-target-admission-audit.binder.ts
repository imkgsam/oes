import { Injectable, Logger } from '@nestjs/common'
import type { TenantTargetAuditBinder, TenantTargetAuditBinding } from '@oes/common/authorization'

/** TenantOrgTenantTargetAuditBinder records the re-authorized selector decision before application access. */
@Injectable()
export class TenantOrgTenantTargetAuditBinder implements TenantTargetAuditBinder {
  private readonly logger = new Logger(TenantOrgTenantTargetAuditBinder.name)

  /** Persists one credential-free structured admission fact through Tenant Org's audit log sink. */
  bind({ decision, requestId, traceId }: TenantTargetAuditBinding): boolean {
    this.logger.log({
      eventType: 'TENANT_TARGET_ADMITTED',
      result: 'SUCCEEDED',
      service: 'tenant-org-service',
      module: 'tenant-target-admission',
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
}
