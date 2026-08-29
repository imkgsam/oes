import { Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { createLazyTrustedExecutionRuntime, TrustedExecutionGuard } from '@oes/common/authorization'

const audience = 'urn:oes:service:public-entry-service'
const runtime = createLazyTrustedExecutionRuntime(audience)

/** Binds Public Entry RPC authorization to its exact token audience. */
@Injectable()
export class PublicEntryTrustedExecutionGuard extends TrustedExecutionGuard {
  constructor(reflector: Reflector) {
    super(reflector, runtime.verifier, runtime.workloadIdentityProvider, audience)
  }
}
