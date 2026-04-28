import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { SalesInfrastructureModule } from './modules/sales-infrastructure.module'
import { SalesManagementModule } from './modules/sales-management.module'
import { SalesQueryModule } from './modules/sales-query.module'

/** AppModule wires the sales-service phase 1 runtime skeleton modules and service-scoped logging metadata. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'sales-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    RegistryModule,
    SalesInfrastructureModule,
    SalesQueryModule,
    SalesManagementModule
  ]
})
export class AppModule {}
