import { Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  createLazyTrustedExecutionRuntime,
  ExecutionTokenVerifier,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'

const COLLABORATION_AUDIENCE = 'urn:oes:service:collaboration-service'
const runtime = createLazyTrustedExecutionRuntime(COLLABORATION_AUDIENCE)

/** Provides Collaboration's audience-bound verifier, certificate identity provider, and gRPC guard. */
@Module({
  providers: [
    { provide: ExecutionTokenVerifier, useFactory: () => runtime.verifier },
    { provide: GrpcWorkloadIdentityProvider, useFactory: () => runtime.workloadIdentityProvider },
    { provide: String, useValue: COLLABORATION_AUDIENCE },
    {
      provide: TrustedExecutionGuard,
      useFactory: (
        reflector: Reflector,
        verifier: ExecutionTokenVerifier,
        identity: GrpcWorkloadIdentityProvider,
        audience: string
      ) => new TrustedExecutionGuard(reflector, verifier, identity, audience),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider, String]
    }
  ],
  exports: [TrustedExecutionGuard, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider, String]
})
export class CollaborationTrustedExecutionModule {}
