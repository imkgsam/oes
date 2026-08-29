import { Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { createLazyTrustedExecutionRuntime, TrustedExecutionGuard } from '@oes/common/authorization'

const runtime = createLazyTrustedExecutionRuntime('urn:oes:service:asset-service')

/** Names the Asset audience-bound guard without creating a controller/module cycle. */
@Injectable()
export class SiteMediaTrustedExecutionGuard extends TrustedExecutionGuard {
  constructor(reflector: Reflector) {
    super(reflector, runtime.verifier, runtime.workloadIdentityProvider, 'urn:oes:service:asset-service')
  }
}
