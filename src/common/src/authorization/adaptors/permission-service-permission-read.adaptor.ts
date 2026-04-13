import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '../../constants'
import { GRPC_METADATA_PROPAGATION_FACTORY } from '../constants'
import {
  ListPermissionsResponse,
  ListRolePermissionsRequest,
  PERMISSION_MANAGEMENT_SERVICE_NAME,
  PermissionManagementServiceClient
} from '../../generated/permission_service/permission_management'
import { InjectGrpcClient, safeGrpcCall } from '../../transport'
import { GrpcRequestContextStore } from '../services/grpc-request-context.store'
import { GrpcMetadataPropagationFactory } from '../types'

const DEFAULT_ROLE_PERMISSION_CACHE_TTL_MS = 30_000

interface RolePermissionCacheEntry {
  permissionCodes: string[]
  expiresAt: number
}

@Injectable()
export class PermissionServicePermissionReadAdaptor implements OnModuleInit {
  private readonly logger = new Logger(PermissionServicePermissionReadAdaptor.name)
  private readonly cache = new Map<string, RolePermissionCacheEntry>()
  private readonly inflight = new Map<string, Promise<string[]>>()
  private readonly cacheTtlMs = this.resolveCacheTtlMs()
  private permissionManagementService!: PermissionManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PERMISSION)
    private readonly permissionClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.permissionManagementService =
      this.permissionClient.getService<PermissionManagementServiceClient>(
        PERMISSION_MANAGEMENT_SERVICE_NAME
      )
  }

  async listPermissionCodesByRoleId(roleId: string): Promise<string[]> {
    const normalizedRoleId = roleId.trim()

    if (!normalizedRoleId) {
      return []
    }

    const cached = this.getCachedPermissions(normalizedRoleId)
    if (cached) {
      return [...cached]
    }

    const inflight = this.inflight.get(normalizedRoleId)
    if (inflight) {
      return [...(await inflight)]
    }

    const pending = this.fetchPermissionCodes(normalizedRoleId)
    this.inflight.set(normalizedRoleId, pending)

    try {
      const permissionCodes = await pending

      this.cache.set(normalizedRoleId, {
        permissionCodes,
        expiresAt: this.now() + this.cacheTtlMs
      })

      return [...permissionCodes]
    } finally {
      this.inflight.delete(normalizedRoleId)
    }
  }

  private buildRequest(roleId: string): ListRolePermissionsRequest {
    this.logger.debug(`Resolving permissions for role=${roleId}`)
    return { roleId }
  }

  private async fetchPermissionCodes(roleId: string): Promise<string[]> {
    const response = await safeGrpcCall<ListPermissionsResponse>(
      this.permissionManagementService.listRolePermissions(this.buildRequest(roleId), this.metadata()),
      {
        caller: 'common',
        method: 'PermissionManagementService.listRolePermissions'
      }
    )

    return [...new Set(
      (response.permissions ?? [])
        .map((permission) => permission.code?.trim() ?? '')
        .filter((code) => code.length > 0)
    )]
  }

  private getCachedPermissions(roleId: string): string[] | null {
    const entry = this.cache.get(roleId)

    if (!entry) {
      return null
    }

    if (entry.expiresAt <= this.now()) {
      this.cache.delete(roleId)
      return null
    }

    return entry.permissionCodes
  }

  private resolveCacheTtlMs(): number {
    const rawValue = process.env.OPERATOR_ROLE_PERMISSION_CACHE_TTL_MS
    const parsed = Number(rawValue)

    if (!rawValue || Number.isNaN(parsed) || parsed <= 0) {
      return DEFAULT_ROLE_PERMISSION_CACHE_TTL_MS
    }

    return parsed
  }

  private now(): number {
    return Date.now()
  }

  private metadata() {
    const current = this.requestContextStore.getContext()
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: this.resolveCurrentServiceName(),
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }

  private resolveCurrentServiceName(): string {
    const candidates = [process.env.MODULE_NAME, process.env.npm_package_name]

    for (const candidate of candidates) {
      const normalized = candidate?.trim()
      if (normalized) {
        return normalized
      }
    }

    return 'unknown-service'
  }
}
