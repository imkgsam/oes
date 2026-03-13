import { Inject, Injectable } from '@nestjs/common'
import { PERMISSION_MANAGEMENT_PORT } from '@oes/common/constants'
import { PermissionManagementPort } from '@oes/common/contracts'
import {
  CreatePermissionRequest,
  DeletePermissionRequest,
  GetPermissionByCodeRequest,
  ListPermissionsResponse,
  ListPermissionsByModuleRequest,
  PermissionResponse,
  CreateRoleRequest,
  DeleteRoleRequest,
  GetRoleByIdRequest,
  ListRolesResponse,
  RoleResponse
} from '@oes/common/generated'

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
    return this.managementPort.listPermissions()
  }

  async listPermissionsByModule(
    req: ListPermissionsByModuleRequest
  ): Promise<ListPermissionsResponse> {
    return this.managementPort.listPermissionsByModule(req)
  }

  // 鈹€鈹€ Role 鈹€鈹€

  async createRole(req: CreateRoleRequest): Promise<RoleResponse> {
    return this.managementPort.createRole(req)
  }

  async deleteRole(req: DeleteRoleRequest): Promise<void> {
    return this.managementPort.deleteRole(req)
  }

  async getRoleById(req: GetRoleByIdRequest): Promise<RoleResponse> {
    return this.managementPort.getRoleById(req)
  }

  async listRoles(): Promise<ListRolesResponse> {
    return this.managementPort.listRoles()
  }
}
