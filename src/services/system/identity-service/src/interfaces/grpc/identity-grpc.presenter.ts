import {
  AccountContactAsset,
  AccountOrgMembership,
  AuditEventRecord,
  ApiKey,
  ServiceAccount
} from '@oes/common/generated/identity_service'
import {
  AccountContactAssetView,
  AccountOrgMembershipView,
  AuditEventView,
  ApiKeyView,
  ServiceAccountView
} from '../../application/queries'

export class IdentityGrpcPresenter {
  static toContactAsset(asset: AccountContactAssetView): AccountContactAsset {
    return {
      id: asset.id,
      tenantId: asset.tenantId,
      accountId: asset.accountId,
      type: asset.type,
      value: asset.value,
      status: asset.status,
      isPrimary: asset.isPrimary,
      assignedAt: asset.assignedAt.toISOString(),
      revokedAt: asset.revokedAt?.toISOString() ?? ''
    }
  }

  static toAccountOrgMembership(membership: AccountOrgMembershipView): AccountOrgMembership {
    return {
      id: membership.id,
      accountId: membership.accountId,
      orgId: membership.orgId,
      orgName: membership.orgName ?? '',
      orgType: membership.orgType ?? '',
      relationType: membership.relationType,
      isPrimary: membership.isPrimary
    }
  }

  static toServiceAccount(account: ServiceAccountView): ServiceAccount {
    return {
      id: account.id,
      tenantId: account.tenantId ?? '',
      scopeLevel: account.scopeLevel,
      type: account.type,
      name: account.name,
      description: account.description ?? '',
      status: account.status,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
      createdBy: account.createdBy ?? '',
      disabledAt: account.disabledAt?.toISOString() ?? '',
      disabledBy: account.disabledBy ?? ''
    }
  }

  static toApiKey(apiKey: ApiKeyView): ApiKey {
    return {
      id: apiKey.id,
      serviceAccountId: apiKey.serviceAccountId,
      keyCode: apiKey.keyCode,
      status: apiKey.status,
      expiresAt: apiKey.expiresAt?.toISOString() ?? '',
      lastUsedAt: apiKey.lastUsedAt?.toISOString() ?? '',
      createdAt: apiKey.createdAt.toISOString(),
      updatedAt: apiKey.updatedAt.toISOString(),
      createdBy: apiKey.createdBy ?? '',
      revokedAt: apiKey.revokedAt?.toISOString() ?? '',
      revokedBy: apiKey.revokedBy ?? ''
    }
  }

  static toAuditEvent(event: AuditEventView): AuditEventRecord {
    return {
      eventId: event.eventId,
      service: event.service,
      module: event.module,
      eventType: event.eventType,
      occurredAt: event.occurredAt.toISOString(),
      result: event.result,
      operatorId: event.operatorId ?? '',
      operatorType: event.operatorType,
      tenantId: event.tenantId ?? '',
      orgId: event.orgId ?? '',
      traceId: event.traceId ?? '',
      resourceType: event.resourceType,
      resourceId: event.resourceId ?? '',
      detailsJson: JSON.stringify(event.details)
    }
  }
}
