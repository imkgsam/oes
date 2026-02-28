import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { InjectGrpcClient } from '@oes/common/transport/grpc/grpc-client.decorator'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport/grpc/safe-grpc-call'
import { PermissionManagementPort } from '@oes/common/contracts/permission_service/management.port'
import {
  PermissionManagementServiceClient,
  CreatePermissionRequest,
  DeletePermissionRequest,
  GetPermissionByCodeRequest,
  ListPermissionsByModuleRequest,
  ListPermissionsResponse,
  PermissionResponse,
  CreateRoleRequest,
  DeleteRoleRequest,
  GetRoleByIdRequest,
  ListRolesResponse,
  RoleResponse,
  PERMISSION_MANAGEMENT_SERVICE_NAME
} from '@oes/common/generated/permission_service/permission_management'

const CALLER = 'api-gateway'

@Injectable()
export class PermissionManagementGrpcAdapter implements PermissionManagementPort, OnModuleInit {
  private svc!: PermissionManagementServiceClient

  constructor(
    @InjectGrpcClient('permission-service')
    private readonly client: ClientGrpc
  ) {}

  onModuleInit() {
    this.svc = this.client.getService<PermissionManagementServiceClient>(
      PERMISSION_MANAGEMENT_SERVICE_NAME
    )
  }

  // ── Permission ──

  async createPermission(req: CreatePermissionRequest): Promise<PermissionResponse> {
    return safeGrpcCall(this.svc.createPermission(req), this.opts('createPermission'))
  }

  async deletePermission(req: DeletePermissionRequest): Promise<void> {
    await safeGrpcCall(this.svc.deletePermission(req), this.opts('deletePermission'))
  }

  async getPermissionByCode(req: GetPermissionByCodeRequest): Promise<PermissionResponse> {
    return safeGrpcCall(this.svc.getPermissionByCode(req), this.opts('getPermissionByCode'))
  }

  async listPermissions(): Promise<ListPermissionsResponse> {
    return safeGrpcCall(this.svc.listPermissions({}), this.opts('listPermissions'))
  }

  async listPermissionsByModule(
    req: ListPermissionsByModuleRequest
  ): Promise<ListPermissionsResponse> {
    return safeGrpcCall(this.svc.listPermissionsByModule(req), this.opts('listPermissionsByModule'))
  }

  // ── Role ──

  async createRole(req: CreateRoleRequest): Promise<RoleResponse> {
    return safeGrpcCall(this.svc.createRole(req), this.opts('createRole'))
  }

  async deleteRole(req: DeleteRoleRequest): Promise<void> {
    await safeGrpcCall(this.svc.deleteRole(req), this.opts('deleteRole'))
  }

  async getRoleById(req: GetRoleByIdRequest): Promise<RoleResponse> {
    return safeGrpcCall(this.svc.getRoleById(req), this.opts('getRoleById'))
  }

  async listRoles(): Promise<ListRolesResponse> {
    return safeGrpcCall(this.svc.listRoles({}), this.opts('listRoles'))
  }

  // ── Helpers ──

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
