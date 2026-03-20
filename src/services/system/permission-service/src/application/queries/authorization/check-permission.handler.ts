import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ACCOUNT_AUTHORIZATION_SERVICE } from './check-permission-with-context.handler'
import { CheckPermissionQuery } from './check-permission.query'
import { AccountAuthorizationService } from '../../../domain/services/account-authorization.service'

@QueryHandler(CheckPermissionQuery)
export class CheckPermissionHandler implements IQueryHandler<CheckPermissionQuery> {
  constructor(
    @Inject(ACCOUNT_AUTHORIZATION_SERVICE)
    private readonly authzService: AccountAuthorizationService
  ) {}

  async execute(query: CheckPermissionQuery): Promise<boolean> {
    return this.authzService.checkPermission(query.accountId, query.permissionCode)
  }
}
