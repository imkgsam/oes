import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { NacosConfigModule } from '@oes/common/config'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { TerminalDeviceModule } from './modules/terminal-device/terminal-device.module'


@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true
    }),
    LoggingModule.forRoot({ serviceName: 'terminal-device-service' }),
    RegistryModule,
    NacosConfigModule,
    TerminalDeviceModule
  ]
})
// AppModule wires terminal-device-service infrastructure and exposes managed terminal device boundaries.
export class AppModule {}
