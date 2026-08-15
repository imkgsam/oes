import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { AuthorizationModule } from '@oes/common/authorization'
import { NacosConfigModule } from '@oes/common/config'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { IdentityAuditModule } from './modules/identity-audit/identity-audit.module'
import { IdentityMachineAuthModule } from './modules/identity-machine-auth/identity-machine-auth.module'
import { IdentityManagementModule } from './modules/identity-management/identity-management.module'
import { IdentityQueryModule } from './modules/identity-query/identity-query.module'
import { IdentityTrustedExecutionModule } from './modules/identity-trusted-execution.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true
    }),
    LoggingModule.forRoot({ serviceName: 'identity-service' }),
    RegistryModule,
    NacosConfigModule,
    EventEmitterModule.forRoot(),
    AuthorizationModule,
    IdentityAuditModule,
    IdentityMachineAuthModule,
    IdentityTrustedExecutionModule,
    IdentityManagementModule,
    IdentityQueryModule
  ]
})
/**
 * AppModule wires identity-service infrastructure and enables service-scoped logging metadata.
 */
export class AppModule {}
