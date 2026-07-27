import { ExceptionFactory, ACCESS_DENIED } from '@oes/common/exceptions'
import { VerifiedTenantTarget } from './tenant-target-binding.types'

export const VERIFIED_TENANT_TARGET_REQUEST_KEY: unique symbol = Symbol(
  'gateway.verified-tenant-target'
)

/** VerifiedTenantTargetRequest carries the guard-produced target without mutating raw route parameters. */
export interface VerifiedTenantTargetRequest {
  [VERIFIED_TENANT_TARGET_REQUEST_KEY]?: VerifiedTenantTarget
}

/** setVerifiedTenantTarget stores the only tenant target that downstream gateway code may trust. */
export function setVerifiedTenantTarget(
  request: VerifiedTenantTargetRequest,
  target: VerifiedTenantTarget
): void {
  request[VERIFIED_TENANT_TARGET_REQUEST_KEY] = target
}

/** getVerifiedTenantTarget returns the guard-produced target and fails closed if guard ordering is broken. */
export function getVerifiedTenantTarget(
  request: VerifiedTenantTargetRequest
): VerifiedTenantTarget {
  const target = request[VERIFIED_TENANT_TARGET_REQUEST_KEY]
  if (!target) {
    throw ExceptionFactory.application(ACCESS_DENIED)
  }
  return target
}
