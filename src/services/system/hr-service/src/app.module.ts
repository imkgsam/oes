import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggingModule } from '@oes/common/logging'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { HrManagementModule } from './modules/hr-management/hr-management.module'
import { HrOnboardingModule } from './modules/hr-onboarding/hr-onboarding.module'
import { HrQueryModule } from './modules/hr-query/hr-query.module'
import { HrTrustedExecutionModule } from './modules/hr-trusted-execution.module'

/** AppModule wires hr-service modules and enables service-scoped logging metadata. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'hr-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    PrismaModule,
    HrTrustedExecutionModule,
    HrQueryModule,
    HrManagementModule,
    HrOnboardingModule
  ]
})
export class AppModule {}
