import { Injectable } from '@nestjs/common'
import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  type GatewayPermissionTrustedMetadataProvider
} from '@oes/common/authorization'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../infrastructure/grpc/trusted-auth.grpc.client'
import { GatewayVerifiedSourceCredentialVault } from './gateway-verified-source-credential.vault'

type PermissionRequest = Parameters<GatewayPermissionTrustedMetadataProvider['create']>[0]

/** Produces the exact Gateway HUMAN_OBO carrier for Permission CheckPermission. */
@Injectable()
export class GatewayPermissionTrustedMetadata implements GatewayPermissionTrustedMetadataProvider {
  constructor(
    private readonly trustedExecution: GatewayFoundationTrustedGrpcExecutionProducer,
    private readonly vault: GatewayVerifiedSourceCredentialVault,
    private readonly accessor: AsyncLocalTransportPrivateSourceCredentialAccessor
  ) {}

  async create(request: PermissionRequest) {
    const headers = request.headers ?? {}
    return this.vault.run(request, this.accessor, () =>
      this.trustedExecution.forInternalCall(
        {
          requestId: exact(request.requestId) ?? exact(headers['x-request-id']),
          traceparent: exact(headers.traceparent),
          tracestate: exact(headers.tracestate),
          user: request.user as any
        },
        'urn:oes:service:permission-service',
        ['permission.internal.permission.check']
      )
    )
  }
}

function exact(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 && value.trim() === value ? value : undefined
}
