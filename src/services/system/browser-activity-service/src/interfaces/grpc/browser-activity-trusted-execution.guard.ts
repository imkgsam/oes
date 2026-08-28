import { Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { createLazyTrustedExecutionRuntime, TrustedExecutionGuard } from '@oes/common/authorization'

const audience = 'urn:oes:service:browser-activity-service'
const runtime = createLazyTrustedExecutionRuntime(audience)

/** Binds Browser Activity RPC authorization to its exact token audience. */
@Injectable()
export class BrowserActivityTrustedExecutionGuard extends TrustedExecutionGuard {
  constructor(reflector: Reflector) {
    super(reflector, runtime.verifier, runtime.workloadIdentityProvider, audience)
  }
}
