import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ACCOUNT_AUTHORIZATION_SERVICE } from './check-permission-with-context.handler'
import {
  BatchAuthorizationDecisionItemResult,
  BatchCheckPermissionQuery
} from './batch-check-permission.query'
import { AccountAuthorizationService } from '../../../domain/services/account-authorization.service'

@QueryHandler(BatchCheckPermissionQuery)
export class BatchCheckPermissionHandler
  implements IQueryHandler<BatchCheckPermissionQuery, BatchAuthorizationDecisionItemResult[]>
{
  constructor(
    @Inject(ACCOUNT_AUTHORIZATION_SERVICE)
    private readonly authzService: AccountAuthorizationService
  ) {}

  async execute(query: BatchCheckPermissionQuery): Promise<BatchAuthorizationDecisionItemResult[]> {
    return Promise.all(
      query.items.map(async (item) => {
        const allowed = await this.authzService.checkPermission(item.accountId, item.permissionCode)

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
