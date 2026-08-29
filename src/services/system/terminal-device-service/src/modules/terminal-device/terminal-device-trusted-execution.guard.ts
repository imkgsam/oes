import { Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { createLazyTrustedExecutionRuntime, TrustedExecutionGuard } from '@oes/common/authorization'

const TERMINAL_DEVICE_AUDIENCE = 'urn:oes:service:terminal-device-service'
const runtime = createLazyTrustedExecutionRuntime(TERMINAL_DEVICE_AUDIENCE)

/** Binds Terminal Device ingress authorization to its exact service audience. */
@Injectable()
export class TerminalDeviceTrustedExecutionGuard extends TrustedExecutionGuard {
  constructor(reflector: Reflector) {
    super(reflector, runtime.verifier, runtime.workloadIdentityProvider, TERMINAL_DEVICE_AUDIENCE)
  }
}
