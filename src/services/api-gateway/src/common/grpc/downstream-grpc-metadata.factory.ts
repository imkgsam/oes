import { Injectable, UnauthorizedException } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import {
  INTERNAL_SERVICE_NAME_METADATA_KEY,
  OPERATOR_CONTEXT_METADATA_KEY,
  OperatorContextCryptoService,
  OperatorContextPayload,
  REQUEST_ID_METADATA_KEY,
  TRACE_ID_METADATA_KEY,
  encodeOperatorContext
} from '@oes/common/security'
import { getTraceId } from '@oes/common/tracing'

const INTERNAL_SERVICE_NAME = 'api-gateway'
const OPERATOR_CONTEXT_TTL_MS = 5 * 60 * 1000

export interface GatewayAuthenticatedUser {
  holderId?: string
  userId?: string
  tenantId?: string
  id?: string
  sub?: string
  typ?: string
  roles?: string[]
  permissions?: string[]
  exp?: number
}

export interface DownstreamRequestSource {
  user?: GatewayAuthenticatedUser
  requestId?: string
  traceId?: string
}

@Injectable()
export class DownstreamGrpcMetadataFactory {
  constructor(private readonly crypto: OperatorContextCryptoService) {}

  createManagementMetadata(source: DownstreamRequestSource): Metadata {
    const metadata = this.createInternalServiceMetadata(source)
    metadata.set(OPERATOR_CONTEXT_METADATA_KEY, encodeOperatorContext(this.buildPayload(source)))
    return metadata
  }

  createInternalServiceMetadata(
    source?: Pick<DownstreamRequestSource, 'requestId' | 'traceId'>
  ): Metadata {
    const metadata = new Metadata()
    metadata.set(INTERNAL_SERVICE_NAME_METADATA_KEY, INTERNAL_SERVICE_NAME)

    const requestId = source?.requestId?.trim()
    const traceId = source?.traceId?.trim() || getTraceId()

    if (requestId) {
      metadata.set(REQUEST_ID_METADATA_KEY, requestId)
    }

    if (traceId) {
      metadata.set(TRACE_ID_METADATA_KEY, traceId)
    }

    return metadata
  }

  private buildPayload(source: DownstreamRequestSource): OperatorContextPayload {
    const user = source.user
    const operatorId = user?.holderId || user?.id || user?.sub
    const operatorType = user?.typ || 'USER'

    if (!operatorId) {
      throw new UnauthorizedException('authenticated operator context is missing operator id')
    }

    const issuedAtMs = Date.now()
    const tokenExpiresAtMs =
      typeof user?.exp === 'number' && Number.isFinite(user.exp) ? user.exp * 1000 : undefined
    const expiresAtMs =
      tokenExpiresAtMs && tokenExpiresAtMs > issuedAtMs
        ? Math.min(tokenExpiresAtMs, issuedAtMs + OPERATOR_CONTEXT_TTL_MS)
        : issuedAtMs + OPERATOR_CONTEXT_TTL_MS

    const traceId = source.traceId?.trim() || getTraceId()
    const requestId = source.requestId?.trim()
    const unsignedPayload = {
      operator_id: operatorId,
      operator_type: operatorType,
      tenant_id: user?.tenantId,
      issued_at: new Date(issuedAtMs).toISOString(),
      expires_at: new Date(expiresAtMs).toISOString(),
      issuer: INTERNAL_SERVICE_NAME,
      operator_roles: Array.isArray(user?.roles) ? user.roles : undefined,
      operator_permissions: Array.isArray(user?.permissions) ? user.permissions : undefined,
      request_id: requestId,
      trace_id: traceId
    }

    return {
      ...unsignedPayload,
      signature: this.crypto.sign(unsignedPayload)
    }
  }
}
