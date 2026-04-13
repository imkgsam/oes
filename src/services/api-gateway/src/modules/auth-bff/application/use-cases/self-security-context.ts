import { UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'

export interface AuthenticatedSelfContext {
  userId: string
  accountId?: string
  tenantId?: string
  scopeLevel: 'SYSTEM' | 'TENANT'
  sessionId?: string
}

// Resolves the authenticated end-user context required by self-service auth-bff endpoints.
export function getAuthenticatedSelfContext(
  source: DownstreamRequestSource
): AuthenticatedSelfContext {
  const userId = normalize(source.user?.userId) ?? normalize(source.user?.sub)

  if (!userId) {
    throw new UnauthorizedException('authenticated user context is missing user id')
  }

  return {
    userId,
    accountId: normalize(source.user?.holderId) ?? normalize(source.user?.aid),
    tenantId: normalize(source.user?.tenantId) ?? normalize(source.user?.tid),
    scopeLevel: normalizeScopeLevel(source.user?.scopeLevel),
    sessionId: normalize(source.user?.sid)
  }
}

function normalizeScopeLevel(scopeLevel?: string): 'SYSTEM' | 'TENANT' {
  return scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
