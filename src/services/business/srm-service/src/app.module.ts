import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthorizationModule } from '@oes/common/authorization'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { SrmInfrastructureModule } from './modules/srm-infrastructure.module'
import { SrmManagementModule } from './modules/srm-management.module'
import { SrmQueryModule } from './modules/srm-query.module'

/** AppModule wires the srm-service phase 1 runtime modules and downstream party-service client metadata. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'srm-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    AuthorizationModule,
    RegistryModule,
    SrmInfrastructureModule,
    SrmQueryModule,
    SrmManagementModule
  ]
})
export class AppModule {}
