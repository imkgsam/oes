import { Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { createLazyTrustedExecutionRuntime, TrustedExecutionGuard } from '@oes/common/authorization'
import { FinanceInfrastructureModule } from './modules/finance-infrastructure.module'
import { FinanceManagementModule } from './modules/finance-management.module'
import { FinanceQueryModule } from './modules/finance-query.module'

const FINANCE_AUDIENCE = 'urn:oes:service:finance-service'
const trustedExecutionRuntime = createLazyTrustedExecutionRuntime(FINANCE_AUDIENCE)

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
  ],
  providers: [
    {
      provide: TrustedExecutionGuard,
      useFactory: (reflector: Reflector) =>
        new TrustedExecutionGuard(
          reflector,
          trustedExecutionRuntime.verifier,
          trustedExecutionRuntime.workloadIdentityProvider,
          FINANCE_AUDIENCE
        ),
      inject: [Reflector]
    }
  ]
})
export class AppModule {}
