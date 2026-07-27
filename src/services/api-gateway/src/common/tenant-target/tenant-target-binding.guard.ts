import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  ACCESS_DENIED,
  ExceptionFactory,
  UNAUTHENTICATED,
  VALIDATION_FAILED
} from '@oes/common/exceptions'
import { TENANT_TARGET_BINDING_METADATA_KEY } from './tenant-target-binding.decorator'
import { TenantTargetBindingMetadata, VerifiedTenantTarget } from './tenant-target-binding.types'
import {
  setVerifiedTenantTarget,
  VerifiedTenantTargetRequest
} from './verified-tenant-target.request'

const TENANT_IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const PATH_PARAM_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/

type TenantTargetHttpRequest = VerifiedTenantTargetRequest & {
  params?: Record<string, unknown>
  user?: {
    scopeLevel?: unknown
    tenantId?: unknown
    tid?: unknown
  }
}

/** TenantTargetBindingGuard binds marked route targets to authenticated tenant sessions before permission checks. */
@Injectable()
export class TenantTargetBindingGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /** canActivate enforces the frozen TENANT/SYSTEM matrix and emits a verified request-scoped target. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<unknown>(TENANT_TARGET_BINDING_METADATA_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (metadata === undefined) {
      return true
    }
    if (!this.isValidMetadata(metadata)) {
      throw ExceptionFactory.application(ACCESS_DENIED)
    }
    if (context.getType() !== 'http') {
      return false
    }

    const request = context.switchToHttp().getRequest<TenantTargetHttpRequest>()
    const scopeLevel = this.normalizeScopeLevel(request.user?.scopeLevel)
    if (scopeLevel !== 'TENANT' && scopeLevel !== 'SYSTEM') {
      throw ExceptionFactory.application(UNAUTHENTICATED)
    }

    const sessionTenant =
      scopeLevel === 'TENANT'
        ? this.normalizeTenantIdentifier(request.user?.tenantId ?? request.user?.tid)
        : undefined
    if (scopeLevel === 'TENANT' && !sessionTenant) {
      throw ExceptionFactory.application(UNAUTHENTICATED)
    }

    const target = this.normalizeTenantIdentifier(request.params?.[metadata.pathParam])
    if (!target) {
      throw ExceptionFactory.application(VALIDATION_FAILED)
    }
    if (scopeLevel === 'SYSTEM') {
      throw ExceptionFactory.application(ACCESS_DENIED)
    }
    if (sessionTenant !== target) {
      throw ExceptionFactory.application(ACCESS_DENIED)
    }

    setVerifiedTenantTarget(request, target as VerifiedTenantTarget)
    return true
  }

  /** isValidMetadata rejects malformed or non-frozen marker values instead of silently widening access. */
  private isValidMetadata(metadata: unknown): metadata is TenantTargetBindingMetadata {
    try {
      if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
        return false
      }

      const prototype = Object.getPrototypeOf(metadata)
      if (prototype !== Object.prototype && prototype !== null) {
        return false
      }

      const pathParam = Object.getOwnPropertyDescriptor(metadata, 'pathParam')
      const systemPolicy = Object.getOwnPropertyDescriptor(metadata, 'systemPolicy')
      return (
        Boolean(pathParam && 'value' in pathParam) &&
        typeof pathParam?.value === 'string' &&
        PATH_PARAM_NAME_PATTERN.test(pathParam.value) &&
        Boolean(systemPolicy && 'value' in systemPolicy) &&
        systemPolicy?.value === 'DENY'
      )
    } catch {
      return false
    }
  }

  /** normalizeScopeLevel normalizes the authenticated enum without inventing a default scope. */
  private normalizeScopeLevel(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined
    }
    const normalized = value.trim().toUpperCase()
    return normalized || undefined
  }

  /** normalizeTenantIdentifier trims and validates opaque gateway tenant identifiers. */
  private normalizeTenantIdentifier(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined
    }
    const normalized = value.trim()
    return TENANT_IDENTIFIER_PATTERN.test(normalized) ? normalized : undefined
  }
}
