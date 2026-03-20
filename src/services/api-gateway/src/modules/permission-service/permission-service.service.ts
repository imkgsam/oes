import { Inject, Injectable } from '@nestjs/common'
import { PERMISSION_MANAGEMENT_PORT } from '@oes/common/constants'
import { PermissionManagementPort } from '@oes/common/contracts'
import {
  CreatePermissionRequest,
  DeletePermissionRequest,
  GetPermissionByCodeRequest,
  ListPermissionsResponse,
  ListPermissionsPagedRequest,
  PermissionResponse,
  DeleteRoleRequest,
  GetRoleByIdRequest,
  ListRolesResponse,
  ListRoleInstancesRequest,
  RoleResponse
} from '@oes/common/generated/permission_service'

@Injectable()
export class PermissionProxyService {
  constructor(
    @Inject(PERMISSION_MANAGEMENT_PORT)
    private readonly managementPort: PermissionManagementPort
  ) {}

  // 鈹€鈹€ Permission 鈹€鈹€

  async createPermission(req: CreatePermissionRequest): Promise<PermissionResponse> {
    return this.managementPort.createPermission(req)
  }

  async deletePermission(req: DeletePermissionRequest): Promise<void> {
    return this.managementPort.deletePermission(req)
  }

  async getPermissionByCode(req: GetPermissionByCodeRequest): Promise<PermissionResponse> {
    return this.managementPort.getPermissionByCode(req)
  }

  async listPermissions(): Promise<ListPermissionsResponse> {
    const result = await this.managementPort.listPermissionsPaged({
      page: 1,
      pageSize: 1000
    } as ListPermissionsPagedRequest)

    return { permissions: result.permissions }
  }

  async listPermissionsByModule(req: { module: string }): Promise<ListPermissionsResponse> {
    const result = await this.managementPort.listPermissionsPaged({
      page: 1,
      pageSize: 1000,
      module: req.module
    } as ListPermissionsPagedRequest)

    return { permissions: result.permissions }
  }


  async deleteRole(req: DeleteRoleRequest): Promise<void> {
    return this.managementPort.deleteRole(req)
  }

  async getRoleById(req: GetRoleByIdRequest): Promise<RoleResponse> {
    return this.managementPort.getRoleById(req)
  }

  async listRoles(): Promise<ListRolesResponse> {
    const result = await this.managementPort.listRoleInstances({
      page: 1,
      pageSize: 1000
    } as ListRoleInstancesRequest)

    return { roles: result.roles }
  }
}
