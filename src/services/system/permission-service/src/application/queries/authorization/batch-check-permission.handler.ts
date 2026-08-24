import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import {
  BatchAuthorizationDecisionItemResult,
  BatchCheckPermissionQuery
} from './batch-check-permission.query'
import {
  ACCOUNT_AUTHORIZATION_SERVICE,
  AccountAuthorizationService
} from '../../../domain/services/account-authorization.service'

// BatchCheckPermissionHandler resolves pure RBAC permission decisions for multiple request items.
@QueryHandler(BatchCheckPermissionQuery)
export class BatchCheckPermissionHandler implements IQueryHandler<
  BatchCheckPermissionQuery,
  BatchAuthorizationDecisionItemResult[]
> {
  constructor(
    @Inject(ACCOUNT_AUTHORIZATION_SERVICE)
    private readonly authzService: AccountAuthorizationService
  ) {}

  async execute(query: BatchCheckPermissionQuery): Promise<BatchAuthorizationDecisionItemResult[]> {
    return Promise.all(
      query.items.map(async (item) => {
        const allowed = await this.authzService.checkPermission(
          item.accountId,
          item.permissionCode,
          item.tenantId
        )

        return {
          requestId: item.requestId,
          allowed,
          evaluationMode: 'RBAC' as const,
          matchedPolicy: '',
          reason: allowed ? 'RBAC_GRANTED' : 'RBAC_DENIED',
          explainCode: allowed ? 'RBAC_GRANTED' : 'RBAC_DENIED'
        }
      })
    )
  }
}
