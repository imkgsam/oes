import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthorizationModule } from '@oes/common/authorization'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { CrmInfrastructureModule } from './modules/crm-infrastructure.module'
import { CrmManagementModule } from './modules/crm-management.module'
import { CrmQueryModule } from './modules/crm-query.module'

/** AppModule wires CRM runtime modules; Party uses the dedicated trusted client module. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'crm-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    AuthorizationModule,
    RegistryModule,
    CrmInfrastructureModule,
    CrmQueryModule,
    CrmManagementModule
  ]
})
export class AppModule {}
