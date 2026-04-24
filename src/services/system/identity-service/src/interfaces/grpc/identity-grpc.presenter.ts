import {
  AccountContactAsset,
  AccountDeletionBlockingReason,
  AccountDeletionCleanupPlan,
  AccountOrgMembership,
  AuditEventRecord,
  ApiKey,
  DeleteAccountResponse,
  EmployeeBinding,
  GetAccountDeletionImpactResponse,
  ServiceAccount
} from '@oes/common/generated/identity_service'
import {
  AccountContactAssetView,
  AccountDeletionImpactView,
  AccountOrgMembershipView,
  AuditEventView,
  ApiKeyView,
  EmployeeBindingSummaryView,
  ServiceAccountView
} from '../../application/queries'
import { DeleteAccountResult } from '../../application/commands'

export class IdentityGrpcPresenter {
  static toAccountDeletionCleanupPlan(
    plan: AccountDeletionImpactView['cleanupPlan']
  ): AccountDeletionCleanupPlan {
    return {
      willDeleteSessions: plan.willDeleteSessions,
      willClearRoles: plan.willClearRoles,
      willDeleteOrgMemberships: plan.willDeleteOrgMemberships,
      willDeleteContactAssets: plan.willDeleteContactAssets
    }
  }

  static toAccountDeletionBlockingReason(
    reason: AccountDeletionImpactView['blockingReasons'][number]
  ): AccountDeletionBlockingReason {
    return {
      resourceType: reason.resourceType,
      resourceCount: reason.resourceCount,
      message: reason.message
    }
  }

  static toAccountDeletionImpact(
    impact: AccountDeletionImpactView
  ): GetAccountDeletionImpactResponse {
    return {
      accountId: impact.accountId,
      canDelete: impact.canDelete,
      userRetained: impact.userRetained,
      cleanupPlan: this.toAccountDeletionCleanupPlan(impact.cleanupPlan),
      blockingReasons: impact.blockingReasons.map((reason) =>
        this.toAccountDeletionBlockingReason(reason)
      ),
      orgMembershipCount: impact.orgMembershipCount,
      contactAssetCount: impact.contactAssetCount
    }
  }

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

  static toEmployeeBinding(binding: EmployeeBindingSummaryView): EmployeeBinding {
    return {
      id: binding.id,
      tenantId: binding.tenantId,
      accountId: binding.accountId,
      employeeId: binding.employeeId
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

  static toDeleteAccountResponse(result: DeleteAccountResult): DeleteAccountResponse {
    return {
      accountId: result.accountId,
      deletedOrgMembershipCount: result.deletedOrgMembershipCount,
      deletedContactAssetCount: result.deletedContactAssetCount,
      userRetained: result.userRetained
    }
  }
}
