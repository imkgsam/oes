import { Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { createLazyTrustedExecutionRuntime, TrustedExecutionGuard, TrustedInternalExecutionGuard } from '@oes/common/authorization'

const audience = 'urn:oes:service:site-service'
const runtime = createLazyTrustedExecutionRuntime(audience)

/** Binds Site BUSINESS RPC authorization to Site's exact audience. */
@Injectable()
export class SiteTrustedExecutionGuard extends TrustedExecutionGuard {
  constructor(reflector: Reflector) { super(reflector, runtime.verifier, runtime.workloadIdentityProvider, audience) }
}

/** Binds Site INTERNAL RPC authorization to Site's exact audience. */
@Injectable()
export class SiteTrustedInternalExecutionGuard extends TrustedInternalExecutionGuard {
  constructor(reflector: Reflector) { super(reflector, runtime.verifier, runtime.workloadIdentityProvider, audience) }
}
