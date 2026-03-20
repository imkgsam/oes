import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { InjectGrpcClient } from '@oes/common/transport'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  PermissionManagementServiceClient,
  CreatePermissionRequest,
  DeletePermissionRequest,
  GetPermissionByCodeRequest,
  ListPermissionsPagedRequest,
  ListPermissionsResponse,
  PermissionResponse,
  DeleteRoleRequest,
  GetRoleByIdRequest,
  ListRolesResponse,
  ListRoleInstancesRequest,
  RoleResponse,
  PERMISSION_MANAGEMENT_SERVICE_NAME
} from '@oes/common/generated/permission_service'

const CALLER = 'api-gateway'

@Injectable()
export class PermissionManagementGrpcAdapter implements OnModuleInit {
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

  // Permission methods

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
    const result = await safeGrpcCall(
      this.svc.listPermissionsPaged({ page: 1, pageSize: 1000 }),
      this.opts('listPermissionsPaged')
    )

    return { permissions: result.permissions }
  }

  async listPermissionsByModule(req: { module: string }): Promise<ListPermissionsResponse> {
    const result = await safeGrpcCall(
      this.svc.listPermissionsPaged({
        page: 1,
        pageSize: 1000,
        module: req.module
      } as ListPermissionsPagedRequest),
      this.opts('listPermissionsPaged')
    )

    return { permissions: result.permissions }
  }

  // Role methods

  async deleteRole(req: DeleteRoleRequest): Promise<void> {
    await safeGrpcCall(this.svc.deleteRole(req), this.opts('deleteRole'))
  }

  async getRoleById(req: GetRoleByIdRequest): Promise<RoleResponse> {
    return safeGrpcCall(this.svc.getRoleById(req), this.opts('getRoleById'))
  }

  async listRoles(): Promise<ListRolesResponse> {
    const result = await safeGrpcCall(
      this.svc.listRoleInstances({ page: 1, pageSize: 1000 } as ListRoleInstancesRequest),
      this.opts('listRoleInstances')
    )

    return { roles: result.roles }
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
