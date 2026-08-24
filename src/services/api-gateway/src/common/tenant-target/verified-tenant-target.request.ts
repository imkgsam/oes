import { ExceptionFactory, ACCESS_DENIED } from '@oes/common/exceptions'
import { VerifiedTenantTarget } from './tenant-target-binding.types'

const verifiedTargets = new WeakMap<object, VerifiedTenantTarget>()

/** VerifiedTenantTargetRequest is the opaque object identity used by the request-private carrier. */
export type VerifiedTenantTargetRequest = object

/** setVerifiedTenantTarget stores exactly one immutable guard-produced target outside request properties. */
export function setVerifiedTenantTarget(
  request: VerifiedTenantTargetRequest,
  target: VerifiedTenantTarget
): void {
  if (verifiedTargets.has(request)) {
    throw ExceptionFactory.application(ACCESS_DENIED)
  }
  verifiedTargets.set(request, target)
}

/** getVerifiedTenantTarget returns the guard-produced target and fails closed if guard ordering is broken. */
export function getVerifiedTenantTarget(
  request: VerifiedTenantTargetRequest
): VerifiedTenantTarget {
  const target = verifiedTargets.get(request)
  if (!target) {
    throw ExceptionFactory.application(ACCESS_DENIED)
  }
  return target
}
