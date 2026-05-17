import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { PermissionModule } from '../permission/permission.module'
import { RoleModule } from '../role/role.module'
import { PolicyModule } from '../policy/policy.module'
import { AccessSummaryQueryHandlers } from '../../application/queries/access-summary'
import { AuthorizationQueryHandlers } from '../../application/queries/authorization'
import { TerminalAccessRuntimeQueryHandlers } from '../../application/queries/terminal-access'
import { ACCOUNT_AUTHORIZATION_SERVICE } from '../../application/queries/authorization/check-permission-with-context.handler'
import { SYMBOLS } from '../../common/constants/symbols'
import { AccountAuthorizationService } from '../../domain/services/account-authorization.service'
import { NavigationResolverService } from '../../domain/services/navigation-resolver.service'
import { TerminalAccessResolverService } from '../../domain/services/terminal-access-resolver.service'
import { PolicyEngine } from '../../domain/services/policy-engine'
import {
  PolicyTemplateInstanceAuthorizationService,
  PolicyTemplateInstanceReader
} from '../../application/authorization/resource-policy'
import { ResourceAuthorizationService } from '../../application/authorization/resource-authorization.service'
import { PermissionAccessSummaryGrpcController } from '../../interfaces/grpc/permission-access-summary.grpc.controller'
import { PermissionCheckGrpcController } from '../../interfaces/grpc/permission-check.grpc.controller'
import { PermissionTerminalAccessGrpcController } from '../../interfaces/grpc/permission-terminal-access.grpc.controller'
import { PermissionAuditModule } from '../audit/permission-audit.module'

@Module({
  imports: [CqrsModule, PermissionModule, RoleModule, PolicyModule, PermissionAuditModule],
  providers: [
    PolicyEngine,
    NavigationResolverService,
    TerminalAccessResolverService,
    {
      provide: PolicyTemplateInstanceReader,
      useFactory: (policyTemplateInstanceRepo: any) =>
        new PolicyTemplateInstanceReader(policyTemplateInstanceRepo),
      inject: [SYMBOLS.REPO.POLICY_TEMPLATE_INSTANCE]
    },
    {
      provide: PolicyTemplateInstanceAuthorizationService,
      useFactory: (reader: PolicyTemplateInstanceReader) =>
        new PolicyTemplateInstanceAuthorizationService(reader),
      inject: [PolicyTemplateInstanceReader]
    },
    ResourceAuthorizationService,
    {
      provide: ACCOUNT_AUTHORIZATION_SERVICE,
      useFactory: (roleRepo: any, permRepo: any, policyRepo: any, engine: PolicyEngine) =>
        new AccountAuthorizationService(roleRepo, permRepo, policyRepo, engine),
      inject: [SYMBOLS.REPO.ROLE, SYMBOLS.REPO.PERMISSION, SYMBOLS.REPO.POLICY, PolicyEngine]
    },
    ValidatingQueryBus,
    ...AccessSummaryQueryHandlers,
    ...TerminalAccessRuntimeQueryHandlers,
    ...AuthorizationQueryHandlers
  ],
  controllers: [
    PermissionCheckGrpcController,
    PermissionAccessSummaryGrpcController,
    PermissionTerminalAccessGrpcController
  ],
  exports: [ResourceAuthorizationService]
})
export class AuthorizationModule {}
