import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { AUTH_SESSION_REVOCATION_PORT } from '../../application/ports/auth-session-revocation.port'
import { AUTH_LOGIN_ONBOARDING_PORT } from '../../application/ports/auth-login-onboarding.port'
import { HR_EMPLOYEE_ONBOARDING_PORT } from '../../application/ports/hr-employee-onboarding.port'
import { IDENTITY_ACCOUNT_ONBOARDING_PORT } from '../../application/ports/identity-account-onboarding.port'
import { ORGANIZATION_PARTY_READER } from '../../application/ports/organization-party-reader.port'
import { PARTY_REGISTRATION_PORT } from '../../application/ports/party-registration.port'
import { PERMISSION_TENANT_ONBOARDING_PORT } from '../../application/ports/permission-tenant-onboarding.port'
import {
  ORG_UNIT_REPOSITORY,
  TENANT_ONBOARDING_RUN_REPOSITORY,
  TENANT_REPOSITORY
} from '../../domain/repositories'
import { TenantOnboardingService, TenantOrgManagementService } from '../../application/services'
import { AuthLoginOnboardingGrpcAdapter } from '../../infrastructure/adapters/auth-login-onboarding.grpc.adapter'
import { HrEmployeeOnboardingGrpcAdapter } from '../../infrastructure/adapters/hr-employee-onboarding.grpc.adapter'
import { IdentityAccountOnboardingGrpcAdapter } from '../../infrastructure/adapters/identity-account-onboarding.grpc.adapter'
import { PartyQueryGrpcAdapter } from '../../infrastructure/adapters/party-query.grpc.adapter'
import { PartyRegistrationGrpcAdapter } from '../../infrastructure/adapters/party-registration.grpc.adapter'
import { TenantOrgPartyTrustedGrpcClient } from '../../infrastructure/adapters/party-trusted-grpc.client'
import { TenantOrgPartyMachineSourceCredentialClient } from '../../infrastructure/adapters/tenant-org-party-machine-source-credential.client'
import { TenantOrgPartyMachineSourceCredentialProvider } from '../../infrastructure/adapters/tenant-org-party-machine-source-credential.provider'
import { TenantOrgPartyExecutionTokenExchangeClient } from '../../infrastructure/adapters/tenant-org-party-execution-token-exchange.client'
import { TenantOrgPartyTrustedGrpcExecutionProducer } from '../../infrastructure/adapters/tenant-org-party-trusted-grpc-execution.producer'
import { TenantOrgTrustedExecutionModule } from '../tenant-org-trusted-execution.module'
import { PermissionTenantOnboardingGrpcAdapter } from '../../infrastructure/adapters/permission-tenant-onboarding.grpc.adapter'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { AuthSessionRevocationGrpcAdapter } from '../../infrastructure/adapters/auth-session-revocation.grpc.adapter'
import { PrismaOrgUnitRepository } from '../../infrastructure/repositories/prisma-org-unit.repository'
import { PrismaTenantOnboardingRunRepository } from '../../infrastructure/repositories/prisma-tenant-onboarding-run.repository'
import { PrismaTenantRepository } from '../../infrastructure/repositories/prisma-tenant.repository'
import { TenantOrgManagementGrpcController } from '../../interfaces/grpc/tenant-org-management.grpc.controller'

/** TenantOrgManagementModule wires tenant/org write-side gRPC controllers to repositories. */
@Module({
  imports: [PrismaModule, AuthorizationModule, TenantOrgTrustedExecutionModule],
  providers: [
    {
      provide: TENANT_REPOSITORY,
      useClass: PrismaTenantRepository
    },
    {
      provide: ORG_UNIT_REPOSITORY,
      useClass: PrismaOrgUnitRepository
    },
    {
      provide: TENANT_ONBOARDING_RUN_REPOSITORY,
      useClass: PrismaTenantOnboardingRunRepository
    },
    {
      provide: ORGANIZATION_PARTY_READER,
      useClass: PartyQueryGrpcAdapter
    },
    {
      provide: AUTH_SESSION_REVOCATION_PORT,
      useClass: AuthSessionRevocationGrpcAdapter
    },
    {
      provide: PARTY_REGISTRATION_PORT,
      useClass: PartyRegistrationGrpcAdapter
    },
    {
      provide: IDENTITY_ACCOUNT_ONBOARDING_PORT,
      useClass: IdentityAccountOnboardingGrpcAdapter
    },
    {
      provide: AUTH_LOGIN_ONBOARDING_PORT,
      useClass: AuthLoginOnboardingGrpcAdapter
    },
    {
      provide: HR_EMPLOYEE_ONBOARDING_PORT,
      useClass: HrEmployeeOnboardingGrpcAdapter
    },
    {
      provide: PERMISSION_TENANT_ONBOARDING_PORT,
      useClass: PermissionTenantOnboardingGrpcAdapter
    },
    AuthSessionRevocationGrpcAdapter,
    PartyQueryGrpcAdapter,
    PartyRegistrationGrpcAdapter,
    IdentityAccountOnboardingGrpcAdapter,
    AuthLoginOnboardingGrpcAdapter,
    HrEmployeeOnboardingGrpcAdapter,
    PermissionTenantOnboardingGrpcAdapter,
    TenantOnboardingService,
    TenantOrgManagementService
  ],
  controllers: [TenantOrgManagementGrpcController]
})
export class TenantOrgManagementModule {}
