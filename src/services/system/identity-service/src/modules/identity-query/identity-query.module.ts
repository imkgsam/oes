import { Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { CqrsModule } from '@nestjs/cqrs'
import {
  createLazyTrustedExecutionRuntime,
  ExecutionTokenVerifier,
  TrustedInternalExecutionGuard
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { SYMBOLS } from '../../common/constants'
import {
  AccountQueryHandlers,
  AuditQueryHandlers,
  ContactQueryHandlers,
  EmployeeBindingQueryHandlers,
  ServiceAccountQueryHandlers,
  UserQueryHandlers
} from '../../application/queries'
import {
  AccountContactAssetQueryScopeBuilder,
  AccountQueryScopeBuilder,
  ApiKeyQueryScopeBuilder,
  AuditEventQueryScopeBuilder,
  AUTHORIZATION_QUERY_SCOPE_BUILDERS,
  AuthorizationQueryScopeService,
  CheckResourceService,
  QueryScopeBuilder,
  ServiceAccountQueryScopeBuilder
} from '../../application/authorization'
import {
  ACCOUNT_DELETION_BLOCKER_CHECKERS,
  AccountDeletionBlockerService
} from '../../application/services/account-deletion-blocker.service'
import { PrismaAccountContactAssetRepository } from '../../infrastructure/repositories/prisma/prisma.account-contact-asset.repository'
import { PrismaApiKeyRepository } from '../../infrastructure/repositories/prisma/prisma.api-key.repository'
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma/prisma.account.repository'
import { PrismaEmployeeBindingRepository } from '../../infrastructure/repositories/prisma/prisma.employee-binding.repository'
import { PrismaServiceAccountRepository } from '../../infrastructure/repositories/prisma/prisma.service-account.repository'
import { PrismaMachineWorkloadBindingRepository } from '../../infrastructure/repositories/prisma/prisma.machine-workload-binding.repository'
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma/prisma.user.repository'
import { PrismaIdentityAuditRepository } from '../../infrastructure/repositories/prisma/prisma.identity-audit.repository'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { IdentityQueryGrpcController } from '../../interfaces/grpc/identity-query.grpc.controller'

const IDENTITY_SERVICE_AUDIENCE = 'urn:oes:service:identity-service'

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    {
      provide: SYMBOLS.REPO.USER,
      useClass: PrismaUserRepository
    },
    {
      provide: SYMBOLS.REPO.ACCOUNT,
      useClass: PrismaAccountRepository
    },
    {
      provide: SYMBOLS.REPO.EMPLOYEE_BINDING,
      useClass: PrismaEmployeeBindingRepository
    },
    {
      provide: SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET,
      useClass: PrismaAccountContactAssetRepository
    },
    {
      provide: SYMBOLS.REPO.API_KEY,
      useClass: PrismaApiKeyRepository
    },
    {
      provide: SYMBOLS.REPO.AUDIT_EVENT,
      useClass: PrismaIdentityAuditRepository
    },
    {
      provide: SYMBOLS.REPO.SERVICE_ACCOUNT,
      useClass: PrismaServiceAccountRepository
    },
    {
      provide: SYMBOLS.REPO.MACHINE_WORKLOAD_BINDING,
      useClass: PrismaMachineWorkloadBindingRepository
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    AuthorizationQueryScopeService,
    CheckResourceService,
    AccountDeletionBlockerService,
    AccountQueryScopeBuilder,
    AccountContactAssetQueryScopeBuilder,
    ApiKeyQueryScopeBuilder,
    AuditEventQueryScopeBuilder,
    ServiceAccountQueryScopeBuilder,
    {
      provide: AUTHORIZATION_QUERY_SCOPE_BUILDERS,
      useFactory: (
        accountBuilder: AccountQueryScopeBuilder,
        contactAssetBuilder: AccountContactAssetQueryScopeBuilder,
        apiKeyBuilder: ApiKeyQueryScopeBuilder,
        auditEventBuilder: AuditEventQueryScopeBuilder,
        serviceAccountBuilder: ServiceAccountQueryScopeBuilder
      ): QueryScopeBuilder[] => [
        accountBuilder,
        contactAssetBuilder,
        apiKeyBuilder,
        auditEventBuilder,
        serviceAccountBuilder
      ],
      inject: [
        AccountQueryScopeBuilder,
        AccountContactAssetQueryScopeBuilder,
        ApiKeyQueryScopeBuilder,
        AuditEventQueryScopeBuilder,
        ServiceAccountQueryScopeBuilder
      ]
    },
    {
      provide: ACCOUNT_DELETION_BLOCKER_CHECKERS,
      useValue: []
    },
    {
      provide: ExecutionTokenVerifier,
      useFactory: () => createLazyTrustedExecutionRuntime(IDENTITY_SERVICE_AUDIENCE).verifier
    },
    {
      provide: GrpcWorkloadIdentityProvider,
      useFactory: () =>
        createLazyTrustedExecutionRuntime(IDENTITY_SERVICE_AUDIENCE).workloadIdentityProvider
    },
    {
      provide: TrustedInternalExecutionGuard,
      useFactory: (
        reflector: Reflector,
        verifier: ExecutionTokenVerifier,
        workloadIdentityProvider: GrpcWorkloadIdentityProvider
      ) =>
        new TrustedInternalExecutionGuard(
          reflector,
          verifier,
          workloadIdentityProvider,
          IDENTITY_SERVICE_AUDIENCE
        ),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider]
    },
    ...UserQueryHandlers,
    ...AccountQueryHandlers,
    ...EmployeeBindingQueryHandlers,
    ...ContactQueryHandlers,
    ...ServiceAccountQueryHandlers,
    ...AuditQueryHandlers
  ],
  controllers: [IdentityQueryGrpcController]
})
export class IdentityQueryModule {}
