import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  OnModuleInit,
  ServiceUnavailableException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ClientGrpc } from '@nestjs/microservices'
import { IS_PUBLIC_KEY } from '../../auth/decorators/is-public.decorator'
import { SERVICE_NAMES } from '../../constants'
import { AppLogger } from '../../logging/app-logger.service'
import { PermissionCheckServiceClient } from '../../generated/permission_service/permission_check'
import { InjectGrpcClient } from '../../transport/grpc/grpc-client.decorator'
import { safeGrpcCall } from '../../transport/grpc/safe-grpc-call'
import {
  GATEWAY_ROUTE_SESSION_TERMINALS_METADATA_KEY,
  GATEWAY_PERMISSION_TRUSTED_METADATA_PROVIDER,
  REQUIRE_PERMISSIONS_METADATA_KEY
} from '../constants'
import type {
  GatewayRouteSessionTerminalsMetadata,
  RequirePermissionsMetadata
} from '../decorators'
import { getPermissionCodeDefinition } from '../permission-codes'
import type { PermissionDefinition, PermissionScopeLevel } from '../permission-codes'
import { TRUSTED_SESSION_TERMINALS } from '../trusted-execution/trusted-execution-context'

const PERMISSION_CHECK_TIMEOUT_MS = 3000
const TENANT_TARGET_ROUTE_PATTERN = /(?:^|\/):tenantId(?=\/|$)/

type GatewaySubjectScope = Extract<PermissionScopeLevel, 'SYSTEM' | 'TENANT'>

type ResolvedRoutePermission = {
  code: string
  allowedScopeLevels: readonly GatewaySubjectScope[]
}

type GatewayPermissionRequest = {
  headers?: Record<string, unknown>
  requestId?: string
  route?: { path?: unknown }
  user?: {
    holderId?: string
    aid?: string
    id?: string
    sub?: string
    scopeLevel?: unknown
    tenantId?: unknown
    terminal?: unknown
    tid?: unknown
  }
}

export interface GatewayPermissionTrustedMetadataProvider {
  create(request: GatewayPermissionRequest): Promise<import('@grpc/grpc-js').Metadata>
}

/** Enforces Gateway route grants and canonical Permission Code scope eligibility. */
@Injectable()
export class GatewayPermissionGuard implements CanActivate, OnModuleInit {
  private permissionSvc!: PermissionCheckServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PERMISSION)
    private readonly permissionClient: ClientGrpc,
    private readonly reflector: Reflector,
    private readonly logger: AppLogger,
    @Inject(GATEWAY_PERMISSION_TRUSTED_METADATA_PROVIDER)
    private readonly trustedMetadata: GatewayPermissionTrustedMetadataProvider
  ) {}

  /** Resolves the generated Permission client from the deployment-owned gRPC channel. */
  onModuleInit() {
    this.permissionSvc =
      this.permissionClient.getService<PermissionCheckServiceClient>('PermissionCheckService')
  }

  /** Stops missing, denied, scope-ineligible or unavailable decisions before Gateway continuation. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const reflectionTargets = [context.getHandler(), context.getClass()]
    const metadata = this.reflector.getAllAndOverride<RequirePermissionsMetadata>(
      REQUIRE_PERMISSIONS_METADATA_KEY,
      reflectionTargets
    )
    const request = context.switchToHttp().getRequest<GatewayPermissionRequest>()
    if (!metadata) {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, reflectionTargets)
      return Boolean(isPublic) || !this.isTenantTargetRoute(request)
    }

    const routeTerminals = this.reflector.getAllAndOverride<unknown>(
      GATEWAY_ROUTE_SESSION_TERMINALS_METADATA_KEY,
      reflectionTargets
    )
    if (
      routeTerminals !== undefined &&
      !this.isRouteTerminalAdmitted(routeTerminals, request.user?.terminal)
    )
      return false

    const requirement = this.resolveRequirement(metadata)
    if (!requirement) return false
    const routePermissions = this.resolveRoutePermissions(requirement.permissions)
    if (!routePermissions) return false
    const accountId = this.resolveOperatorId(request.user)
    const subject = this.resolveSubject(request.user)
    if (!accountId || !subject) return false

    const results = await Promise.all(
      routePermissions.map((permission) =>
        this.checkSingle(request, accountId, permission, subject.scopeLevel, subject.tenantId)
      )
    )

    return requirement.mode === 'all' ? results.every(Boolean) : results.some(Boolean)
  }

  /** Resolves one non-empty exact route Code set and denies malformed declarations. */
  private resolveRequirement(
    metadata: RequirePermissionsMetadata
  ): { mode: 'all' | 'any'; permissions: string[] } | undefined {
    const hasAll = Array.isArray(metadata.all)
    const hasAny = Array.isArray(metadata.any)
    if (hasAll === hasAny) return undefined

    const mode = hasAll ? 'all' : 'any'
    const permissions = metadata[mode]
    if (
      !Array.isArray(permissions) ||
      permissions.length === 0 ||
      permissions.some((code) => typeof code !== 'string' || code.trim().length === 0)
    ) {
      return undefined
    }

    return { mode, permissions: permissions.map((code) => code.trim()) }
  }

  /** Reads one exact Code from the canonical Common definition lookup. */
  private resolvePermissionDefinition(code: string): PermissionDefinition | undefined {
    return getPermissionCodeDefinition(code)
  }

  /** Resolves the entire declared Code set before any current-grant RPC may start. */
  private resolveRoutePermissions(codes: readonly string[]): ResolvedRoutePermission[] | undefined {
    const resolved: ResolvedRoutePermission[] = []
    for (const code of codes) {
      const definition = this.resolvePermissionDefinition(code)
      if (!definition) return undefined
      resolved.push({
        code,
        allowedScopeLevels: this.resolveAllowedScopeLevels(definition.allowedScopeLevels)
      })
    }
    return resolved
  }

  /** Calls Permission for one declared Code and combines its grant with local scope eligibility. */
  private async checkSingle(
    request: GatewayPermissionRequest,
    accountId: string,
    permission: ResolvedRoutePermission,
    scopeLevel: GatewaySubjectScope,
    tenantId?: string
  ): Promise<boolean> {
    let response: unknown
    try {
      response = await safeGrpcCall(
        this.permissionSvc.checkPermission(
          { accountId, permissionCode: permission.code, ...(tenantId ? { tenantId } : {}) },
          await this.trustedMetadata.create(request)
        ),
        {
          timeoutMs: PERMISSION_CHECK_TIMEOUT_MS,
          caller: 'api-gateway',
          method: 'PermissionCheckService.checkPermission'
        }
      )
    } catch (error) {
      this.logger.warn('Permission decision unavailable; stopping Gateway continuation', {
        accountId,
        permissionCode: permission.code,
        error: (error as Error)?.message ?? error
      })
      throw this.permissionUnavailable('RPC_FAILURE')
    }

    return (
      this.resolvePermissionDecision(response) && permission.allowedScopeLevels.includes(scopeLevel)
    )
  }

  /** Validates canonical static metadata without inventing a fallback scope. */
  private resolveAllowedScopeLevels(value: unknown): readonly GatewaySubjectScope[] {
    if (
      !Array.isArray(value) ||
      value.length === 0 ||
      value.some((scope) => scope !== 'SYSTEM' && scope !== 'TENANT') ||
      new Set(value).size !== value.length
    ) {
      throw this.permissionUnavailable('MALFORMED_SCOPE_METADATA')
    }

    return value
  }

  /** Applies only an exact route terminal declaration and otherwise leaves admission to Permission. */
  private isRouteTerminalAdmitted(value: unknown, terminal: unknown): boolean {
    if (
      !Array.isArray(value) ||
      value.length === 0 ||
      value.some(
        (candidate) =>
          !TRUSTED_SESSION_TERMINALS.includes(
            candidate as (typeof TRUSTED_SESSION_TERMINALS)[number]
          )
      ) ||
      new Set(value).size !== value.length ||
      typeof terminal !== 'string'
    )
      return false
    return (value as GatewayRouteSessionTerminalsMetadata).includes(
      terminal as (typeof TRUSTED_SESSION_TERMINALS)[number]
    )
  }

  /** Requires Permission's unchanged response to carry an explicit boolean decision. */
  private resolvePermissionDecision(response: unknown): boolean {
    try {
      if (typeof response !== 'object' || response === null || Array.isArray(response)) {
        throw this.permissionUnavailable('MALFORMED_DECISION')
      }

      const descriptor = Object.getOwnPropertyDescriptor(response, 'allowed')
      if (!descriptor || !('value' in descriptor) || typeof descriptor.value !== 'boolean') {
        throw this.permissionUnavailable('MALFORMED_DECISION')
      }

      return descriptor.value
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error
      throw this.permissionUnavailable('MALFORMED_DECISION')
    }
  }

  /** Resolves the authenticated scope and retains only its subject tenant, never a path target. */
  private resolveSubject(
    user?: GatewayPermissionRequest['user']
  ): { scopeLevel: GatewaySubjectScope; tenantId?: string } | undefined {
    const scopeLevel = user?.scopeLevel
    if (scopeLevel !== 'SYSTEM' && scopeLevel !== 'TENANT') return undefined

    const tenantId = this.normalizeText(user.tenantId) ?? this.normalizeText(user.tid)
    if (scopeLevel === 'SYSTEM') {
      const hasTenantClaim = user.tenantId !== undefined || user.tid !== undefined
      return hasTenantClaim ? undefined : { scopeLevel }
    }
    return tenantId ? { scopeLevel, tenantId } : undefined
  }

  /** Identifies the canonical tenant-target route shape for missing-Code denial. */
  private isTenantTargetRoute(request: GatewayPermissionRequest): boolean {
    const routePath = request.route?.path
    return typeof routePath === 'string' && TENANT_TARGET_ROUTE_PATTERN.test(routePath)
  }

  /** Creates the stable HTTP 503 used for unavailable or malformed Permission decisions. */
  private permissionUnavailable(reason: string): ServiceUnavailableException {
    return new ServiceUnavailableException({
      code: 'PERMISSION_DECISION_UNAVAILABLE',
      message: 'Permission decision unavailable',
      details: { reason }
    })
  }

  /** Resolves the authenticated account id from current and legacy verified session shapes. */
  private resolveOperatorId(user?: GatewayPermissionRequest['user']): string | undefined {
    const candidates = [user?.holderId, user?.aid, user?.id, user?.sub]
    for (const candidate of candidates) {
      const normalized = this.normalizeText(candidate)
      if (normalized) return normalized
    }
    return undefined
  }

  /** Normalizes authenticated subject text without reading a client-controlled target selector. */
  private normalizeText(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined
    const normalized = value.trim()
    return normalized || undefined
  }
}
