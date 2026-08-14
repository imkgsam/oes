import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthorizationModule } from '@oes/common/authorization'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { WmsInfrastructureModule } from './modules/wms-infrastructure.module'
import { WmsManagementModule } from './modules/wms-management.module'
import { WmsQueryModule } from './modules/wms-query.module'

/** AppModule wires the wms-service phase 1 runtime modules and downstream procurement and item-master clients. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'wms-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    AuthorizationModule,
    RegistryModule,
    WmsInfrastructureModule,
    WmsQueryModule,
    WmsManagementModule
  ]
})
export class AppModule {}
