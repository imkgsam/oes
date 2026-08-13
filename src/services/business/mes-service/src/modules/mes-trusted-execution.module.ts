import { Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { createLazyTrustedExecutionRuntime, ExecutionTokenVerifier, TrustedExecutionGuard } from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'

const MES_AUDIENCE = 'urn:oes:service:mes-service'
const runtime = createLazyTrustedExecutionRuntime(MES_AUDIENCE)

/** Supplies MES's audience-bound verifier, workload identity provider, and trusted execution guard. */
@Module({
  providers: [
    { provide: ExecutionTokenVerifier, useFactory: () => runtime.verifier },
    { provide: GrpcWorkloadIdentityProvider, useFactory: () => runtime.workloadIdentityProvider },
    { provide: String, useValue: MES_AUDIENCE },
    {
      provide: TrustedExecutionGuard,
      useFactory: (reflector: Reflector, verifier: ExecutionTokenVerifier, identity: GrpcWorkloadIdentityProvider, audience: string) =>
        new TrustedExecutionGuard(reflector, verifier, identity, audience),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider, String]
    }
  ],
  exports: [ExecutionTokenVerifier, GrpcWorkloadIdentityProvider, String, TrustedExecutionGuard]
})
export class MesTrustedExecutionModule {}
