import { Injectable } from '@nestjs/common'
import { ACCESS_DENIED, ExceptionFactory } from '@oes/common/exceptions'
import { OperatorScope } from './operator-scope'

// Applies resource-level tenant boundary checks for identity detail queries.
@Injectable()
export class CheckResourceService {
  checkAccount(operatorScope: OperatorScope | undefined, input: {
    resourceId: string
    tenantId: string
  }): void {
    this.ensureTenantBoundAccess(operatorScope, {
      resourceType: 'account',
      resourceId: input.resourceId,
      tenantId: input.tenantId
    })
  }

  checkTenant(operatorScope: OperatorScope | undefined, input: {
    resourceId: string
    tenantId: string
  }): void {
    this.ensureTenantBoundAccess(operatorScope, {
      resourceType: 'tenant',
      resourceId: input.resourceId,
      tenantId: input.tenantId
    })
  }

  checkServiceAccount(operatorScope: OperatorScope | undefined, input: {
    resourceId: string
    tenantId: string | null
  }): void {
    this.ensureTenantBoundAccess(operatorScope, {
      resourceType: 'service_account',
      resourceId: input.resourceId,
      tenantId: input.tenantId
    })
  }

  checkApiKey(operatorScope: OperatorScope | undefined, input: {
    resourceId: string
    tenantId: string | null
  }): void {
    this.ensureTenantBoundAccess(operatorScope, {
      resourceType: 'api_key',
      resourceId: input.resourceId,
      tenantId: input.tenantId
    })
  }

  checkContactAsset(operatorScope: OperatorScope | undefined, input: {
    resourceId: string
    tenantId: string
  }): void {
    this.ensureTenantBoundAccess(operatorScope, {
      resourceType: 'account_contact_asset',
      resourceId: input.resourceId,
      tenantId: input.tenantId
    })
  }

  checkAccountOrgMembership(operatorScope: OperatorScope | undefined, input: {
    resourceId: string
    tenantId: string
  }): void {
    this.ensureTenantBoundAccess(operatorScope, {
      resourceType: 'account_org_membership',
      resourceId: input.resourceId,
      tenantId: input.tenantId
    })
  }

  // Enforces that tenant-scoped operators can only access resources inside their own tenant boundary.
  private ensureTenantBoundAccess(operatorScope: OperatorScope | undefined, input: {
    resourceType: string
    resourceId: string
    tenantId: string | null
  }): void {
    if (!operatorScope || operatorScope.isSystemScope) {
      return
    }

    if (input.tenantId && input.tenantId === operatorScope.tenantId) {
      return
    }

    throw ExceptionFactory.application(ACCESS_DENIED, {
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      tenantId: input.tenantId,
      operatorTenantId: operatorScope.tenantId
    })
  }
}
