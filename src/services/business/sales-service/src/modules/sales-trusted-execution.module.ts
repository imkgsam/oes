import { Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  createLazyTrustedExecutionRuntime,
  ExecutionTokenVerifier,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'

const SALES_AUDIENCE = 'urn:oes:service:sales-service'
const trustedExecutionRuntime = createLazyTrustedExecutionRuntime(SALES_AUDIENCE)

/** Supplies the Sales-specific verifier, workload identity, audience, and guard dependencies. */
@Module({
  providers: [
    { provide: ExecutionTokenVerifier, useFactory: () => trustedExecutionRuntime.verifier },
    {
      provide: GrpcWorkloadIdentityProvider,
      useFactory: () => trustedExecutionRuntime.workloadIdentityProvider
    },
    { provide: String, useValue: SALES_AUDIENCE },
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
export class SalesTrustedExecutionModule {}
