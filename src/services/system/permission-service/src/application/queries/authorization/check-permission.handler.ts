import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { CheckPermissionQuery } from './check-permission.query'
import {
  ACCOUNT_AUTHORIZATION_SERVICE,
  AccountAuthorizationService
} from '../../../domain/services/account-authorization.service'

// CheckPermissionHandler resolves the current pure RBAC permission decision for one account.
@QueryHandler(CheckPermissionQuery)
export class CheckPermissionHandler implements IQueryHandler<CheckPermissionQuery> {
  constructor(
    @Inject(ACCOUNT_AUTHORIZATION_SERVICE)
    private readonly authzService: AccountAuthorizationService
  ) {}

  async execute(query: CheckPermissionQuery): Promise<boolean> {
    return this.authzService.checkPermission(query.accountId, query.permissionCode, query.tenantId)
  }
}
