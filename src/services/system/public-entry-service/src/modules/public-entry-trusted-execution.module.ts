import { Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { createLazyTrustedExecutionRuntime, TrustedExecutionGuard } from '@oes/common/authorization'

const PUBLIC_ENTRY_AUDIENCE = 'urn:oes:service:public-entry-service'
const runtime = createLazyTrustedExecutionRuntime(PUBLIC_ENTRY_AUDIENCE)

/** Composes Public Entry's single token-only gRPC guard and exact target audience. */
@Module({
  providers: [{
    provide: TrustedExecutionGuard,
    useFactory: (reflector: Reflector) => new TrustedExecutionGuard(
      reflector,
      runtime.verifier,
      runtime.workloadIdentityProvider,
      PUBLIC_ENTRY_AUDIENCE
    ),
    inject: [Reflector]
  }],
  exports: [TrustedExecutionGuard]
})
export class PublicEntryTrustedExecutionModule {}
