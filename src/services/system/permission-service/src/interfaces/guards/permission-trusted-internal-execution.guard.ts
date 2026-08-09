import { Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ExecutionTokenVerifier, TrustedInternalExecutionGuard } from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'

export const PERMISSION_SERVICE_AUDIENCE = 'urn:oes:service:permission-service'

@Injectable()
/** Binds the shared trusted-execution guard to the Permission service audience for Nest enhancers. */
export class PermissionTrustedInternalExecutionGuard extends TrustedInternalExecutionGuard {
  constructor(
    reflector: Reflector,
    verifier: ExecutionTokenVerifier,
    workloadIdentityProvider: GrpcWorkloadIdentityProvider
  ) {
    super(reflector, verifier, workloadIdentityProvider, PERMISSION_SERVICE_AUDIENCE)
  }
}
