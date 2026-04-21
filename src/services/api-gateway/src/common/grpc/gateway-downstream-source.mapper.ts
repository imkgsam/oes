import { UnauthorizedException } from '@nestjs/common'
import {
  InternalCallMetadataInput,
  OperatorScopedMetadataInput
} from '@oes/common/authorization'

const GATEWAY_SERVICE_NAME = 'api-gateway'

export interface GatewayAuthenticatedUser {
  holderId?: string
  userId?: string
  tenantId?: string
  orgId?: string
  id?: string
  sub?: string
  sid?: string
  aid?: string
  tid?: string
  scopeLevel?: string
  typ?: string
  passwordSetupRequired?: boolean
  roles?: string[]
  permissions?: string[]
  exp?: number
}

export interface DownstreamRequestSource {
  user?: GatewayAuthenticatedUser
  requestId?: string
  traceId?: string
}

export function toInternalCallMetadataInput(
  source?: Pick<DownstreamRequestSource, 'requestId' | 'traceId'>
): InternalCallMetadataInput {
  return {
    callerServiceName: GATEWAY_SERVICE_NAME,
    requestId: normalizeOptional(source?.requestId),
    traceId: normalizeOptional(source?.traceId)
  }
}

export function toOperatorScopedMetadataInput(
  source: DownstreamRequestSource
): OperatorScopedMetadataInput {
  // Builds operator-scoped metadata from gateway JWT claims for downstream service authorization.
  const user = source.user
  const operatorId = user?.holderId || user?.aid || user?.id || user?.sub
  const operatorType = normalizeOptional(user?.typ) ?? 'USER'

  if (!operatorId?.trim()) {
    throw new UnauthorizedException('authenticated operator context is missing operator id')
  }

  return {
    ...toInternalCallMetadataInput(source),
    operatorContext: {
      operatorId,
      operatorType,
      tenantId: normalizeOptional(user?.tenantId) ?? normalizeOptional(user?.tid),
      orgId: normalizeOptional(user?.orgId),
      operatorRoles: normalizeStringArray(user?.roles),
      requestId: normalizeOptional(source.requestId),
      traceId: normalizeOptional(source.traceId)
    }
  }
}

function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeStringArray(values?: string[]): string[] | undefined {
  if (!Array.isArray(values)) {
    return undefined
  }

  const normalized = values.map((value) => value.trim()).filter(Boolean)
  return normalized.length > 0 ? normalized : undefined
}
