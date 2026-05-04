import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import type { ClientProviderOptions } from '@nestjs/microservices/module/interfaces'
import { AuthorizationModule } from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  EMPLOYEE_REPOSITORY,
  EMPLOYMENT_REPOSITORY,
  ONBOARDING_ACCESS_REPOSITORY
} from '../../domain/repositories'
import { HrEmployeeOnboardingService, HrManagementService, HrQueryService } from '../../application/services'
import { PARTY_REGISTRATION_PORT, TENANT_ORG_REFERENCE_PORT } from '../../application/ports'
import { HrOnboardingModule } from '../hr-onboarding/hr-onboarding.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaEmployeeRepository } from '../../infrastructure/repositories/prisma-employee.repository'
import { PrismaEmploymentRepository } from '../../infrastructure/repositories/prisma-employment.repository'
import { PrismaOnboardingAccessRepository } from '../../infrastructure/repositories/prisma-onboarding-access.repository'
import {
  TENANT_ORG_GRPC_CLIENT,
  TenantOrgGrpcAdapter
} from '../../infrastructure/adapters/tenant-org-grpc.adapter'
import {
  PARTY_GRPC_CLIENT,
  PARTY_PROTO_PATH,
  PartyRegistrationGrpcAdapter
} from '../../infrastructure/adapters/party-registration-grpc.adapter'
import { HrManagementGrpcController } from '../../interfaces/grpc/hr-management.grpc.controller'

/** resolveDownstreamGrpcUrl resolves standard service URLs first while preserving legacy local env names. */
function resolveDownstreamGrpcUrl(
  standardEnvKey: string,
  legacyEnvKey: string,
  fallbackUrl: string
): string | undefined {
  const standardUrl = process.env[standardEnvKey]?.trim()
  if (standardUrl) {
    return standardUrl
  }

  const legacyUrl = process.env[legacyEnvKey]?.trim()
  if (legacyUrl) {
    return legacyUrl
  }

  if ((process.env.NODE_ENV ?? 'development') !== 'production') {
    return fallbackUrl
  }

  return undefined
}

/** buildHrManagementGrpcClients declares the HR management downstream clients with canonical local ports. */
export function buildHrManagementGrpcClients(): ClientProviderOptions[] {
  return [
    {
      name: TENANT_ORG_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'tenant_org_service',
        protoPath: [resolveCommonProtoPath('tenant_org_service/tenant_org.proto')],
        url: resolveDownstreamGrpcUrl('GRPC_SERVICE_TENANT_ORG_URL', 'TENANT_ORG_GRPC_URL', '127.0.0.1:50054')
      }
    },
    {
      name: PARTY_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'party_service',
        protoPath: [PARTY_PROTO_PATH],
        url: resolveDownstreamGrpcUrl('GRPC_SERVICE_PARTY_URL', 'PARTY_GRPC_URL', '127.0.0.1:50053')
      }
    }
  ]
}

/** HrManagementModule wires HR write-side gRPC controllers to application services and repositories. */
@Module({
  imports: [
    AuthorizationModule,
    PrismaModule,
    HrOnboardingModule,
    ClientsModule.register(buildHrManagementGrpcClients())
  ],
  providers: [
    {
      provide: EMPLOYEE_REPOSITORY,
      useClass: PrismaEmployeeRepository
    },
    {
      provide: EMPLOYMENT_REPOSITORY,
      useClass: PrismaEmploymentRepository
    },
    {
      provide: ONBOARDING_ACCESS_REPOSITORY,
      useClass: PrismaOnboardingAccessRepository
    },
    {
      provide: TENANT_ORG_REFERENCE_PORT,
      useClass: TenantOrgGrpcAdapter
    },
    {
      provide: PARTY_REGISTRATION_PORT,
      useClass: PartyRegistrationGrpcAdapter
    },
    HrManagementService,
    HrQueryService,
    HrEmployeeOnboardingService
  ],
  controllers: [HrManagementGrpcController]
})
export class HrManagementModule {}
