import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaRoleRepository } from '../../infrastructure/repositories/prisma/prisma.role.repository'
import { PrismaOnboardingGrantRequestRepository } from '../../infrastructure/repositories/prisma/prisma.onboarding-grant-request.repository'
import { PrismaPermissionRepository } from '../../infrastructure/repositories/prisma/prisma.permission.repository'
import { PrismaNavigationRepository } from '../../infrastructure/repositories/prisma/prisma.navigation.repository'
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
import {
  IDENTITY_ACCOUNT_REFERENCE_PORT
} from '../../application/ports/identity-account-reference.port'
import {
  IDENTITY_GRPC_CLIENT,
  IDENTITY_GRPC_CLIENT_OPTIONS,
  IdentityAccountReferenceGrpcAdaptor
} from '../../infrastructure/adaptors/identity-account-reference.grpc.adaptor'

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    ClientsModule.register([
      {
        name: IDENTITY_GRPC_CLIENT,
        transport: Transport.GRPC,
        options: IDENTITY_GRPC_CLIENT_OPTIONS
      }
    ])
  ],
  providers: [
    {
      provide: SYMBOLS.REPO.ROLE,
      useClass: PrismaRoleRepository
    },
    {
      provide: SYMBOLS.REPO.ONBOARDING_GRANT_REQUEST,
      useClass: PrismaOnboardingGrantRequestRepository
    },
    {
      provide: SYMBOLS.REPO.PERMISSION,
      useClass: PrismaPermissionRepository
    },
    {
      provide: SYMBOLS.REPO.NAVIGATION,
      useClass: PrismaNavigationRepository
    },
    {
      provide: IDENTITY_ACCOUNT_REFERENCE_PORT,
      useClass: IdentityAccountReferenceGrpcAdaptor
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
