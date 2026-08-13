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
import { TENANT_REFERENCE_PORT } from '../../application/ports/tenant-reference.port'
import {
  AccountCommandHandlers,
  ContactCommandHandlers,
  EmployeeBindingCommandHandlers,
  ServiceAccountCommandHandlers
} from '../../application/commands'
import { GetAccountDeletionImpactHandler } from '../../application/queries/account/get-account-deletion-impact.handler'
import {
  ACCOUNT_DELETION_BLOCKER_CHECKERS,
  AccountDeletionBlockerService
} from '../../application/services/account-deletion-blocker.service'
import { SYMBOLS } from '../../common/constants'
import { PrismaAccountContactAssetRepository } from '../../infrastructure/repositories/prisma/prisma.account-contact-asset.repository'
import { PrismaApiKeyRepository } from '../../infrastructure/repositories/prisma/prisma.api-key.repository'
import { PrismaAccountRepository } from '../../infrastructure/repositories/prisma/prisma.account.repository'
import { PrismaEmployeeBindingRepository } from '../../infrastructure/repositories/prisma/prisma.employee-binding.repository'
import { PrismaServiceAccountRepository } from '../../infrastructure/repositories/prisma/prisma.service-account.repository'
import { PrismaMachineWorkloadBindingRepository } from '../../infrastructure/repositories/prisma/prisma.machine-workload-binding.repository'
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma/prisma.user.repository'
import {
  HR_GRPC_CLIENT,
  HR_GRPC_CLIENT_OPTIONS,
  HrEmployeeReferenceGrpcAdaptor
} from '../../infrastructure/adaptors/hr-employee-reference.grpc.adaptor'
import { PartyRegistrationGrpcAdaptor } from '../../infrastructure/adaptors/party-registration.grpc.adaptor'
import { IdentityPartyTrustedGrpcClient } from '../../infrastructure/adaptors/party-trusted-grpc.client'
import { IdentityPartyMachineSourceCredentialClient } from '../../infrastructure/adaptors/identity-party-machine-source-credential.client'
import { IdentityPartyMachineSourceCredentialProvider } from '../../infrastructure/adaptors/identity-party-machine-source-credential.provider'
import { IdentityPartyExecutionTokenExchangeClient } from '../../infrastructure/adaptors/identity-party-execution-token-exchange.client'
import { IdentityPartyTrustedGrpcExecutionProducer } from '../../infrastructure/adaptors/identity-party-trusted-grpc-execution.producer'
import { TenantReferenceGrpcAdaptor } from '../../infrastructure/adaptors/tenant-reference.grpc.adaptor'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { IdentityManagementGrpcController } from '../../interfaces/grpc/identity-management.grpc.controller'
import { IdentityAuditModule } from '../identity-audit/identity-audit.module'

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    IdentityAuditModule,
    GrpcTransportModule.forFeature([
      SERVICE_NAMES.PERMISSION,
      SERVICE_NAMES.TENANT_ORG
    ]),
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
      provide: SYMBOLS.REPO.SERVICE_ACCOUNT,
      useClass: PrismaServiceAccountRepository
    },
    {
      provide: SYMBOLS.REPO.MACHINE_WORKLOAD_BINDING,
      useClass: PrismaMachineWorkloadBindingRepository
    },
    {
      provide: PARTY_REGISTRATION_PORT,
      useClass: PartyRegistrationGrpcAdaptor
    },
    IdentityPartyTrustedGrpcClient, IdentityPartyMachineSourceCredentialClient,
    IdentityPartyMachineSourceCredentialProvider, IdentityPartyExecutionTokenExchangeClient,
    { provide: IdentityPartyTrustedGrpcExecutionProducer, useFactory: (source: IdentityPartyMachineSourceCredentialProvider, exchange: IdentityPartyExecutionTokenExchangeClient) => new IdentityPartyTrustedGrpcExecutionProducer(source, exchange), inject: [IdentityPartyMachineSourceCredentialProvider, IdentityPartyExecutionTokenExchangeClient] },
    {
      provide: TENANT_REFERENCE_PORT,
      useClass: TenantReferenceGrpcAdaptor
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
    ...ContactCommandHandlers,
    ...ServiceAccountCommandHandlers
  ],
  controllers: [IdentityManagementGrpcController]
})
export class IdentityManagementModule {}
