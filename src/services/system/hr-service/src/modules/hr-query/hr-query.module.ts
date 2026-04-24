import { Module } from '@nestjs/common'
import {
  EMPLOYEE_REPOSITORY,
  EMPLOYMENT_REPOSITORY,
  ONBOARDING_ACCESS_REPOSITORY
} from '../../domain/repositories'
import { HrQueryService } from '../../application/services'
import { HrOnboardingModule } from '../hr-onboarding/hr-onboarding.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaEmployeeRepository } from '../../infrastructure/repositories/prisma-employee.repository'
import { PrismaEmploymentRepository } from '../../infrastructure/repositories/prisma-employment.repository'
import { PrismaOnboardingAccessRepository } from '../../infrastructure/repositories/prisma-onboarding-access.repository'
import { HrQueryGrpcController } from '../../interfaces/grpc/hr-query.grpc.controller'

/** HrQueryModule wires HR read-only gRPC controllers to Employee and Employment repositories. */
@Module({
  imports: [PrismaModule, HrOnboardingModule],
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
    HrQueryService
  ],
  controllers: [HrQueryGrpcController]
})
export class HrQueryModule {}
