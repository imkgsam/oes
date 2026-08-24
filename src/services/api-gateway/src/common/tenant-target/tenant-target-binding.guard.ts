import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { PATH_METADATA } from '@nestjs/common/constants'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '@oes/common/auth'
import { parseTenantTargetSelector } from '@oes/common/authorization'
import {
  ACCESS_DENIED,
  ExceptionFactory,
  UNAUTHENTICATED,
  VALIDATION_FAILED
} from '@oes/common/exceptions'
import { VerifiedTenantTarget } from './tenant-target-binding.types'

const TENANT_TARGET_ROUTE_PATTERN = /(?:^|\/)\:tenantId(?=\/|$)/
const SITE_MANAGEMENT_P1_ROUTE_PATTERN = /^\/?site-management\/tenants\/\:tenantId(?=\/|$)/
const verifiedTargets = new WeakMap<object, VerifiedTenantTarget>()

type TenantTargetHttpRequest = object & {
  body?: unknown
  params?: Record<string, unknown>
  query?: unknown
  route?: { path?: unknown }
  user?: {
    scopeLevel?: unknown
    tenantId?: unknown
    tid?: unknown
  }
}

/** TenantTargetBindingGuard automatically binds protected canonical :tenantId routes before permission checks. */
@Injectable()
export class TenantTargetBindingGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /** canActivate enforces canonical recognition, duplicate equality and the frozen TENANT/SYSTEM matrix. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true

    const reflectionTargets = [context.getHandler(), context.getClass()]
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, reflectionTargets)) return true

    const request = context.switchToHttp().getRequest<TenantTargetHttpRequest>()
    const routePath = this.canonicalRoutePath(request)
    if (!routePath) {
      if (this.hasOwnTenantParam(request.params)) {
        throw ExceptionFactory.application(ACCESS_DENIED)
      }
      return true
    }
    if (!TENANT_TARGET_ROUTE_PATTERN.test(routePath)) return true

    const target = this.readTargetParam(request.params)
    this.assertCompatibleDuplicate(request.query, target)
    this.assertCompatibleDuplicate(request.body, target)

    const scopeLevel = request.user?.scopeLevel
    if (scopeLevel !== 'TENANT' && scopeLevel !== 'SYSTEM') throw unauthenticated()
    const sessionTenant =
      scopeLevel === 'TENANT'
        ? this.parseSessionTenant(request.user?.tenantId, request.user?.tid)
        : undefined
    if (
      scopeLevel === 'SYSTEM' &&
      (this.hasPresentedValue(request.user?.tenantId) || this.hasPresentedValue(request.user?.tid))
    ) {
      throw unauthenticated()
    }

    if (scopeLevel === 'SYSTEM' && this.isSiteManagementP1(context)) {
      throw ExceptionFactory.application(ACCESS_DENIED)
    }
    if (scopeLevel === 'TENANT' && sessionTenant !== target) {
      throw ExceptionFactory.application(ACCESS_DENIED)
    }

    setVerifiedTenantTarget(request, target as VerifiedTenantTarget)
    return true
  }

  /** canonicalRoutePath reads only the matched framework route template, never a client URL. */
  private canonicalRoutePath(request: TenantTargetHttpRequest): string | undefined {
    const path = request.route?.path
    return typeof path === 'string' ? path : undefined
  }

  /** isSiteManagementP1 identifies the exact controller route independently of deployment prefixes. */
  private isSiteManagementP1(context: ExecutionContext): boolean {
    const controllerPaths = routeMetadataPaths(
      Reflect.getMetadata(PATH_METADATA, context.getClass()) as unknown
    )
    return controllerPaths.some((path) => SITE_MANAGEMENT_P1_ROUTE_PATTERN.test(path))
  }

  /** parseSessionTenant requires every presented authenticated tenant projection to agree exactly. */
  private parseSessionTenant(tenantId: unknown, tid: unknown): string {
    try {
      const primary = parseTenantTargetSelector(tenantId ?? tid)
      if (tenantId !== undefined && parseTenantTargetSelector(tenantId) !== primary) {
        throw unauthenticated()
      }
      if (tid !== undefined && parseTenantTargetSelector(tid) !== primary) {
        throw unauthenticated()
      }
      return primary
    } catch {
      throw unauthenticated()
    }
  }

  /** parseHttpTarget maps a present malformed or non-canonical selector to HTTP 400. */
  private parseHttpTarget(value: unknown): string {
    try {
      return parseTenantTargetSelector(value)
    } catch {
      throw invalidTarget()
    }
  }

  /** readTargetParam accepts only the framework-owned exact data property for the canonical segment. */
  private readTargetParam(params: unknown): string {
    try {
      if (typeof params !== 'object' || params === null) throw invalidTarget()
      const descriptor = Object.getOwnPropertyDescriptor(params, 'tenantId')
      if (!descriptor || !('value' in descriptor)) throw invalidTarget()
      return this.parseHttpTarget(descriptor.value)
    } catch {
      throw invalidTarget()
    }
  }

  /** assertCompatibleDuplicate accepts only an own data field exactly equal to the verified path target. */
  private assertCompatibleDuplicate(container: unknown, target: string): void {
    if (typeof container !== 'object' || container === null) return
    try {
      const descriptor = Object.getOwnPropertyDescriptor(container, 'tenantId')
      if (!descriptor) return
      if (!('value' in descriptor) || this.parseHttpTarget(descriptor.value) !== target) {
        throw invalidTarget()
      }
    } catch {
      throw invalidTarget()
    }
  }

  /** hasPresentedValue rejects every SYSTEM tenant projection rather than normalizing it into absence. */
  private hasPresentedValue(value: unknown): boolean {
    return value !== undefined
  }

  /** hasOwnTenantParam detects a matched selector whose canonical route provenance was lost. */
  private hasOwnTenantParam(params: unknown): boolean {
    try {
      return typeof params === 'object' && params !== null
        ? Object.prototype.hasOwnProperty.call(params, 'tenantId')
        : false
    } catch {
      return true
    }
  }
}

/** getVerifiedTenantTarget returns the guard-produced target and fails closed if ordering is broken. */
export function getVerifiedTenantTarget(request: object): VerifiedTenantTarget {
  const target = verifiedTargets.get(request)
  if (!target) {
    throw ExceptionFactory.application(ACCESS_DENIED)
  }
  return target
}

/** setVerifiedTenantTarget is module-private so only this global guard can produce carrier values. */
function setVerifiedTenantTarget(request: object, target: VerifiedTenantTarget): void {
  if (verifiedTargets.has(request)) {
    throw ExceptionFactory.application(ACCESS_DENIED)
  }
  verifiedTargets.set(request, target)
}

/** routeMetadataPaths accepts only Nest controller path metadata and canonicalizes its slash boundary. */
function routeMetadataPaths(value: unknown): string[] {
  const candidates = Array.isArray(value) ? value : [value]
  return candidates.flatMap((candidate) => {
    if (typeof candidate !== 'string') return []
    const path = candidate.replace(/^\/+|\/+$/g, '')
    return path ? [`/${path}`] : []
  })
}

/** Returns the stable invalid-authenticated-context exception used before target binding. */
function unauthenticated() {
  return ExceptionFactory.application(UNAUTHENTICATED)
}

/** Returns the stable HTTP validation exception used for malformed target input. */
function invalidTarget() {
  return ExceptionFactory.application(VALIDATION_FAILED)
}
