import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaRoleRepository } from '../../infrastructure/repositories/prisma/prisma.role.repository'
import { PrismaPermissionRepository } from '../../infrastructure/repositories/prisma/prisma.permission.repository'
import { SYMBOLS } from '../../common/constants/symbols'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { RoleCommandHandlers } from '../../application/commands/role'
import { RoleQueryHandlers } from '../../application/queries/role'
import {
  AccountRoleQueryScopeBuilder,
  AUTHORIZATION_QUERY_SCOPE_BUILDERS,
  AuthorizationQueryScopeService,
  RoleInstanceQueryScopeBuilder,
  RoleTemplateQueryScopeBuilder
} from '../../application/authorization'

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    {
      provide: SYMBOLS.REPO.ROLE,
      useClass: PrismaRoleRepository
    },
    {
      provide: SYMBOLS.REPO.PERMISSION,
      useClass: PrismaPermissionRepository
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    AuthorizationQueryScopeService,
    RoleInstanceQueryScopeBuilder,
    RoleTemplateQueryScopeBuilder,
    AccountRoleQueryScopeBuilder,
    {
      provide: AUTHORIZATION_QUERY_SCOPE_BUILDERS,
      useFactory: (
        roleInstanceBuilder: RoleInstanceQueryScopeBuilder,
        roleTemplateBuilder: RoleTemplateQueryScopeBuilder,
        accountRoleBuilder: AccountRoleQueryScopeBuilder
      ) => [roleInstanceBuilder, roleTemplateBuilder, accountRoleBuilder],
      inject: [
        RoleInstanceQueryScopeBuilder,
        RoleTemplateQueryScopeBuilder,
        AccountRoleQueryScopeBuilder
      ]
    },
    ...RoleCommandHandlers,
    ...RoleQueryHandlers
  ],
  controllers: [],
  exports: [SYMBOLS.REPO.ROLE]
})
export class RoleModule {}
