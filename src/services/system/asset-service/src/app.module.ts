import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { NacosConfigModule } from '@oes/common/config'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { AssetManagementModule } from './modules/asset-management/asset-management.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true
    }),
    LoggingModule.forRoot({ serviceName: 'asset-service' }),
    RegistryModule,
    NacosConfigModule,
    EventEmitterModule.forRoot(),
    AssetManagementModule
  ]
})
// AppModule wires asset-service infrastructure and exposes the avatar asset gRPC surface.
export class AppModule {}
