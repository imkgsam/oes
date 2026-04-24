import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  EMPLOYEE_REPOSITORY,
  EMPLOYMENT_REPOSITORY
} from '../../domain/repositories'
import { HrManagementService } from '../../application/services'
import { TENANT_ORG_REFERENCE_PORT } from '../../application/ports'
import { HrOnboardingModule } from '../hr-onboarding/hr-onboarding.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaEmployeeRepository } from '../../infrastructure/repositories/prisma-employee.repository'
import { PrismaEmploymentRepository } from '../../infrastructure/repositories/prisma-employment.repository'
import {
  TENANT_ORG_GRPC_CLIENT,
  TenantOrgGrpcAdapter
} from '../../infrastructure/adapters/tenant-org-grpc.adapter'
import { HrManagementGrpcController } from '../../interfaces/grpc/hr-management.grpc.controller'

/** HrManagementModule wires HR write-side gRPC controllers to application services and repositories. */
@Module({
  imports: [
    PrismaModule,
    HrOnboardingModule,
    ClientsModule.register([
      {
        name: TENANT_ORG_GRPC_CLIENT,
        transport: Transport.GRPC,
        options: {
          package: 'tenant_org_service',
          protoPath: [resolveCommonProtoPath('tenant_org_service/tenant_org.proto')],
          url: process.env.TENANT_ORG_GRPC_URL || 'localhost:50054'
        }
      }
    ])
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
      provide: TENANT_ORG_REFERENCE_PORT,
      useClass: TenantOrgGrpcAdapter
    },
    HrManagementService
  ],
  controllers: [HrManagementGrpcController]
})
export class HrManagementModule {}
