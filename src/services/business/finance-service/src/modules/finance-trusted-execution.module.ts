import { Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  createLazyTrustedExecutionRuntime,
  ExecutionTokenVerifier,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'

const FINANCE_AUDIENCE = 'urn:oes:service:finance-service'
const trustedExecutionRuntime = createLazyTrustedExecutionRuntime(FINANCE_AUDIENCE)

/** Supplies the concrete guard constructor dependencies that Nest resolves for each guarded controller. */
@Module({
  providers: [
    {
      provide: ExecutionTokenVerifier,
      useFactory: () => trustedExecutionRuntime.verifier
    },
    {
      provide: GrpcWorkloadIdentityProvider,
      useFactory: () => trustedExecutionRuntime.workloadIdentityProvider
    },
    {
      provide: String,
      useValue: FINANCE_AUDIENCE
    },
    {
      provide: TrustedExecutionGuard,
      useFactory: (
        reflector: Reflector,
        verifier: ExecutionTokenVerifier,
        workloadIdentityProvider: GrpcWorkloadIdentityProvider,
        targetAudience: string
      ) => new TrustedExecutionGuard(reflector, verifier, workloadIdentityProvider, targetAudience),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider, String]
    }
  ],
  exports: [ExecutionTokenVerifier, GrpcWorkloadIdentityProvider, String, TrustedExecutionGuard]
})
export class FinanceTrustedExecutionModule {}
