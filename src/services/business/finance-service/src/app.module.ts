import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { FinanceInfrastructureModule } from './modules/finance-infrastructure.module'
import { FinanceManagementModule } from './modules/finance-management.module'
import { FinanceQueryModule } from './modules/finance-query.module'

/** AppModule wires the finance-service phase 1A runtime skeleton modules and service-scoped logging metadata. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'finance-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    RegistryModule,
    FinanceInfrastructureModule,
    FinanceQueryModule,
    FinanceManagementModule
  ]
})
export class AppModule {}
