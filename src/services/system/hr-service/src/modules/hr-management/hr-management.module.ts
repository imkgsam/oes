import { Module } from '@nestjs/common'
import type { ClientProviderOptions } from '@nestjs/microservices/module/interfaces'
import { AuthorizationModule } from '@oes/common/authorization'
import {
  EMPLOYEE_REPOSITORY,
  EMPLOYMENT_REPOSITORY,
  ONBOARDING_ACCESS_REPOSITORY
} from '../../domain/repositories'
import { HrEmployeeOnboardingService, HrManagementService, HrQueryService } from '../../application/services'
import { HrOnboardingModule } from '../hr-onboarding/hr-onboarding.module'
import {
  buildHrReferenceGrpcClients,
  HrReferenceModule
} from '../../infrastructure/modules/hr-reference.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaEmployeeRepository } from '../../infrastructure/repositories/prisma-employee.repository'
import { PrismaEmploymentRepository } from '../../infrastructure/repositories/prisma-employment.repository'
import { PrismaOnboardingAccessRepository } from '../../infrastructure/repositories/prisma-onboarding-access.repository'
import { HrManagementGrpcController } from '../../interfaces/grpc/hr-management.grpc.controller'

/** buildHrManagementGrpcClients declares the HR management downstream clients with canonical local ports. */
export const buildHrManagementGrpcClients = (): ClientProviderOptions[] => buildHrReferenceGrpcClients()

/** HrManagementModule wires HR write-side gRPC controllers to application services and repositories. */
@Module({
  imports: [
    AuthorizationModule,
    PrismaModule,
    HrOnboardingModule,
    HrReferenceModule
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
    HrManagementService,
    HrQueryService,
    HrEmployeeOnboardingService
  ],
  controllers: [HrManagementGrpcController]
})
export class HrManagementModule {}
