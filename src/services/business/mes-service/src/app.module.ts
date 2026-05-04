import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthorizationModule } from '@oes/common/authorization'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { MesInfrastructureModule } from './modules/mes-infrastructure.module'
import { MesManagementModule } from './modules/mes-management.module'
import { MesQueryModule } from './modules/mes-query.module'

/** AppModule wires the mes-service phase 1 mold runtime modules. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'mes-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    AuthorizationModule,
    RegistryModule,
    MesInfrastructureModule,
    MesQueryModule,
    MesManagementModule
  ]
})
export class AppModule {}
