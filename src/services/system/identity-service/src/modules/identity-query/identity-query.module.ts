import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { SYMBOLS } from '../../common/constants'
import {
  AccountQueryHandlers,
  AuditQueryHandlers,
  ContactQueryHandlers,
  OrgQueryHandlers,
  ServiceAccountQueryHandlers,
  TenantQueryHandlers,
  UserQueryHandlers
} from '../../application/queries'
import {
  AccountContactAssetQueryScopeBuilder,
  AccountMembershipQueryScopeBuilder,
  ApiKeyQueryScopeBuilder,
  AuditEventQueryScopeBuilder,
  AUTHORIZATION_QUERY_SCOPE_BUILDERS,
  AuthorizationQueryScopeService,
  CheckResourceService,
  QueryScopeBuilder,
  ServiceAccountQueryScopeBuilder
} from '../../application/authorization'
import { PrismaAccountContactAssetRepository } from '../../infrastructure/repositories/prisma/prisma.account-contact-asset.repository'
import { PrismaAccountOrgMembershipRepository } from '../../infrastructure/repositories/prisma/prisma.account-org-membership.repository'
import { PrismaApiKeyRepository } from '../../infrastructure/repositories/prisma/prisma.api-key.repository'
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma/prisma.account.repository'
import { PrismaOrgRepository } from '../../infrastructure/repositories/prisma/prisma.org.repository'
import { PrismaServiceAccountRepository } from '../../infrastructure/repositories/prisma/prisma.service-account.repository'
import { PrismaTenantRepository } from '../../infrastructure/repositories/prisma/prisma.tenant.repository'
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma/prisma.user.repository'
import { PrismaIdentityAuditRepository } from '../../infrastructure/repositories/prisma/prisma.identity-audit.repository'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { IdentityQueryGrpcController } from '../../interfaces/grpc/identity-query.grpc.controller'

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
      provide: SYMBOLS.REPO.TENANT,
      useClass: PrismaTenantRepository
    },
    {
      provide: SYMBOLS.REPO.ORG,
      useClass: PrismaOrgRepository
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
      provide: SYMBOLS.REPO.ACCOUNT_ORG_MEMBERSHIP,
      useClass: PrismaAccountOrgMembershipRepository
    },
    {
      provide: SYMBOLS.REPO.AUDIT_EVENT,
      useClass: PrismaIdentityAuditRepository
    },
    {
      provide: SYMBOLS.REPO.SERVICE_ACCOUNT,
      useClass: PrismaServiceAccountRepository
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    AuthorizationQueryScopeService,
    CheckResourceService,
    AccountMembershipQueryScopeBuilder,
    AccountContactAssetQueryScopeBuilder,
    ApiKeyQueryScopeBuilder,
    AuditEventQueryScopeBuilder,
    ServiceAccountQueryScopeBuilder,
    {
      provide: AUTHORIZATION_QUERY_SCOPE_BUILDERS,
      useFactory: (
        membershipBuilder: AccountMembershipQueryScopeBuilder,
        contactAssetBuilder: AccountContactAssetQueryScopeBuilder,
        apiKeyBuilder: ApiKeyQueryScopeBuilder,
        auditEventBuilder: AuditEventQueryScopeBuilder,
        serviceAccountBuilder: ServiceAccountQueryScopeBuilder
      ): QueryScopeBuilder[] => [
        membershipBuilder,
        contactAssetBuilder,
        apiKeyBuilder,
        auditEventBuilder,
        serviceAccountBuilder
      ],
      inject: [
        AccountMembershipQueryScopeBuilder,
        AccountContactAssetQueryScopeBuilder,
        ApiKeyQueryScopeBuilder,
        AuditEventQueryScopeBuilder,
        ServiceAccountQueryScopeBuilder
      ]
    },
    ...UserQueryHandlers,
    ...AccountQueryHandlers,
    ...TenantQueryHandlers,
    ...OrgQueryHandlers,
    ...ContactQueryHandlers,
    ...ServiceAccountQueryHandlers,
    ...AuditQueryHandlers
  ],
  controllers: [IdentityQueryGrpcController]
})
export class IdentityQueryModule {}
