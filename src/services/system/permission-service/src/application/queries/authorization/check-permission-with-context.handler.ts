import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { CheckPermissionWithContextQuery } from './check-permission-with-context.query'
import { AccountAuthorizationService } from '../../../domain/services/account-authorization.service'
import { AuthzDecision } from '../../../domain/services/policy-engine'

export const ACCOUNT_AUTHORIZATION_SERVICE = Symbol('AccountAuthorizationService')

@QueryHandler(CheckPermissionWithContextQuery)
export class CheckPermissionWithContextHandler implements IQueryHandler<CheckPermissionWithContextQuery> {
  constructor(
    @Inject(ACCOUNT_AUTHORIZATION_SERVICE)
    private readonly authzService: AccountAuthorizationService
  ) {}

  async execute(query: CheckPermissionWithContextQuery): Promise<AuthzDecision> {
    return this.authzService.checkPermissionWithContext({
      accountId: query.accountId,
      permissionCode: query.permissionCode,
      tenantId: query.tenantId,
      subject: query.subject,
      resource: query.resource,
      environment: query.environment,
      action: query.action
    })
  }
}
