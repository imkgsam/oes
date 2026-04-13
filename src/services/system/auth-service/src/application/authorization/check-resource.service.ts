import { Injectable } from '@nestjs/common'
import { ACCESS_DENIED, ExceptionFactory } from '@oes/common/exceptions'
import { OperatorScope } from './operator-scope'

// Applies resource-level tenant boundary checks for auth-service resources.
@Injectable()
export class CheckResourceService {
  // Enforces the tenant boundary for a single session resource.
  checkSession(operatorScope: OperatorScope | undefined, input: {
    resourceId: string
    tenantId: string | null
  }): void {
    this.ensureTenantBoundAccess(operatorScope, {
      resourceType: 'session',
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
