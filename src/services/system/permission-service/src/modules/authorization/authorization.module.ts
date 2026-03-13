import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { PermissionModule } from '../permission/permission.module'
import { RoleModule } from '../role/role.module'
import { PolicyModule } from '../policy/policy.module'
import { AuthorizationQueryHandlers } from '../../application/queries/authorization'
import { ACCOUNT_AUTHORIZATION_SERVICE } from '../../application/queries/authorization/check-permission-with-context.handler'
import { SYMBOLS } from '../../common/constants/symbols'
import { AccountAuthorizationService } from '../../domain/services/account-authorization.service'
import { PolicyEngine } from '../../domain/services/policy-engine'
import { PermissionCheckGrpcController } from '../../interfaces/grpc/permission-check.grpc.controller'

@Module({
  imports: [CqrsModule, PermissionModule, RoleModule, PolicyModule],
  providers: [
    PolicyEngine,
    {
      provide: ACCOUNT_AUTHORIZATION_SERVICE,
      useFactory: (roleRepo: any, permRepo: any, policyRepo: any, engine: PolicyEngine) =>
        new AccountAuthorizationService(roleRepo, permRepo, policyRepo, engine),
      inject: [SYMBOLS.REPO.ROLE, SYMBOLS.REPO.PERMISSION, SYMBOLS.REPO.POLICY, PolicyEngine]
    },
    ValidatingQueryBus,
    ...AuthorizationQueryHandlers
  ],
  controllers: [PermissionCheckGrpcController]
})
export class AuthorizationModule {}
