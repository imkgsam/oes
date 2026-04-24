import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ClientsModule, Transport } from '@nestjs/microservices'
import {
  OPERATOR_PERMISSION_RESOLVER,
  PermissionGuard,
  PermissionServicePermissionReadAdaptor,
  RoleBasedOperatorPermissionResolver
} from '@oes/common/authorization'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { CheckResourceService } from '../../application/authorization'
import { HR_EMPLOYEE_REFERENCE_PORT } from '../../application/ports/hr-employee-reference.port'
import { PARTY_REGISTRATION_PORT } from '../../application/ports/party-registration.port'
import {
  AccountCommandHandlers,
  ContactCommandHandlers,
  EmployeeBindingCommandHandlers,
  OrgCommandHandlers,
  ServiceAccountCommandHandlers
} from '../../application/commands'
import { GetAccountDeletionImpactHandler } from '../../application/queries/account/get-account-deletion-impact.handler'
import {
  ACCOUNT_DELETION_BLOCKER_CHECKERS,
  AccountDeletionBlockerService
} from '../../application/services/account-deletion-blocker.service'
import { SYMBOLS } from '../../common/constants'
import { PrismaAccountContactAssetRepository } from '../../infrastructure/repositories/prisma/prisma.account-contact-asset.repository'
import { PrismaAccountOrgMembershipRepository } from '../../infrastructure/repositories/prisma/prisma.account-org-membership.repository'
import { PrismaApiKeyRepository } from '../../infrastructure/repositories/prisma/prisma.api-key.repository'
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma/prisma.account.repository'
import { PrismaEmployeeBindingRepository } from '../../infrastructure/repositories/prisma/prisma.employee-binding.repository'
import { PrismaOrgRepository } from '../../infrastructure/repositories/prisma/prisma.org.repository'
import { PrismaServiceAccountRepository } from '../../infrastructure/repositories/prisma/prisma.service-account.repository'
import { PrismaTenantRepository } from '../../infrastructure/repositories/prisma/prisma.tenant.repository'
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma/prisma.user.repository'
import {
  HR_GRPC_CLIENT,
  HR_GRPC_CLIENT_OPTIONS,
  HrEmployeeReferenceGrpcAdaptor
} from '../../infrastructure/adaptors/hr-employee-reference.grpc.adaptor'
import { PartyRegistrationGrpcAdaptor } from '../../infrastructure/adaptors/party-registration.grpc.adaptor'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { IdentityManagementGrpcController } from '../../interfaces/grpc/identity-management.grpc.controller'
import { IdentityAuditModule } from '../identity-audit/identity-audit.module'

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    IdentityAuditModule,
    GrpcTransportModule.forFeature([SERVICE_NAMES.PERMISSION, SERVICE_NAMES.PARTY]),
    ClientsModule.register([
      {
        name: HR_GRPC_CLIENT,
        transport: Transport.GRPC,
        options: HR_GRPC_CLIENT_OPTIONS
      }
    ])
  ],
  providers: [
    {
      provide: SYMBOLS.REPO.ACCOUNT,
      useClass: PrismaAccountRepository
    },
    {
      provide: SYMBOLS.REPO.USER,
      useClass: PrismaUserRepository
    },
    {
      provide: SYMBOLS.REPO.ORG,
      useClass: PrismaOrgRepository
    },
    {
      provide: SYMBOLS.REPO.ACCOUNT_ORG_MEMBERSHIP,
      useClass: PrismaAccountOrgMembershipRepository
    },
    {
      provide: SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET,
      useClass: PrismaAccountContactAssetRepository
    },
    {
      provide: SYMBOLS.REPO.EMPLOYEE_BINDING,
      useClass: PrismaEmployeeBindingRepository
    },
    {
      provide: SYMBOLS.REPO.API_KEY,
      useClass: PrismaApiKeyRepository
    },
    {
      provide: SYMBOLS.REPO.TENANT,
      useClass: PrismaTenantRepository
    },
    {
      provide: SYMBOLS.REPO.SERVICE_ACCOUNT,
      useClass: PrismaServiceAccountRepository
    },
    {
      provide: PARTY_REGISTRATION_PORT,
      useClass: PartyRegistrationGrpcAdaptor
    },
    {
      provide: HR_EMPLOYEE_REFERENCE_PORT,
      useClass: HrEmployeeReferenceGrpcAdaptor
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    PermissionServicePermissionReadAdaptor,
    RoleBasedOperatorPermissionResolver,
    {
      provide: OPERATOR_PERMISSION_RESOLVER,
      useExisting: RoleBasedOperatorPermissionResolver
    },
    PermissionGuard,
    CheckResourceService,
    AccountDeletionBlockerService,
    {
      provide: ACCOUNT_DELETION_BLOCKER_CHECKERS,
      useValue: []
    },
    GetAccountDeletionImpactHandler,
    ...AccountCommandHandlers,
    ...EmployeeBindingCommandHandlers,
    ...OrgCommandHandlers,
    ...ContactCommandHandlers,
    ...ServiceAccountCommandHandlers
  ],
  controllers: [IdentityManagementGrpcController]
})
export class IdentityManagementModule {}
