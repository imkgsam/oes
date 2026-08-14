import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthorizationModule } from '@oes/common/authorization'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { ProcurementInfrastructureModule } from './modules/procurement-infrastructure.module'
import { ProcurementManagementModule } from './modules/procurement-management.module'
import { ProcurementQueryModule } from './modules/procurement-query.module'

/** AppModule wires the procurement-service phase 1 runtime modules and downstream item SRM client metadata. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'procurement-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    AuthorizationModule,
    RegistryModule,
    ProcurementInfrastructureModule,
    ProcurementQueryModule,
    ProcurementManagementModule
  ]
})
export class AppModule {}
