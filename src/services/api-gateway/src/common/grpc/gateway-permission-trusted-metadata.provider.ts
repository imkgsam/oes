import { Injectable } from '@nestjs/common'
import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  getGrpcAuthorizationBearer,
  TransportPrivateSourceCredentialIssuer,
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
    private readonly accessor: AsyncLocalTransportPrivateSourceCredentialAccessor,
    private readonly issuer: TransportPrivateSourceCredentialIssuer
  ) {}

  async create(request: PermissionRequest) {
    const headers = request.headers ?? {}
    const source = {
      requestId: exact(request.requestId) ?? exact(headers['x-request-id']),
      traceparent: exact(headers.traceparent),
      tracestate: exact(headers.tracestate),
      user: request.user as any
    }
    return this.vault.run(request, this.accessor, async () => {
      const selfMetadata = await this.trustedExecution.forSelfServiceCall(
        source,
        'urn:oes:service:api-gateway'
      )
      const subjectToken = getGrpcAuthorizationBearer(selfMetadata)
      if (!subjectToken) throw new Error('Gateway HUMAN OBO subject token is required')
      return this.accessor.run(
        this.issuer.issueVerifiedExecutionTokenSubjectCredential(subjectToken),
        () =>
          this.trustedExecution.forInternalCall(source, 'urn:oes:service:permission-service', [
            'permission.internal.permission.check'
          ])
      )
    })
  }
}

function exact(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 && value.trim() === value ? value : undefined
}
