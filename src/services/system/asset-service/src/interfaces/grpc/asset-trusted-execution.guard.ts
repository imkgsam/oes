import { Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { createLazyTrustedExecutionRuntime, TrustedExecutionGuard } from '@oes/common/authorization'

const runtime = createLazyTrustedExecutionRuntime('urn:oes:service:asset-service')

/** Binds Asset avatar RPC authorization to Asset's exact execution-token audience. */
@Injectable()
export class AssetTrustedExecutionGuard extends TrustedExecutionGuard {
  constructor(reflector: Reflector) {
    super(reflector, runtime.verifier, runtime.workloadIdentityProvider, 'urn:oes:service:asset-service')
  }
}
