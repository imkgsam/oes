import { Injectable } from '@nestjs/common'
import {
  CreatePermissionRequest,
  DeletePermissionRequest,
  GetPermissionByCodeRequest,
  ListPermissionsResponse,
  PermissionResponse,
  DeleteRoleRequest,
  GetRoleByIdRequest,
  ListRolesResponse,
  RoleResponse
} from '@oes/common/generated/permission_service'
import { DownstreamRequestSource } from '../../common/grpc/downstream-grpc-metadata.factory'
import { PermissionManagementGrpcAdapter } from './adapters/permission-management-grpc.adapter'

@Injectable()
export class PermissionProxyService {
  constructor(private readonly managementPort: PermissionManagementGrpcAdapter) {}

  async createPermission(
    req: CreatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.managementPort.createPermission(req, source)
  }

  async deletePermission(
    req: DeletePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    return this.managementPort.deletePermission(req, source)
  }

  async getPermissionByCode(
    req: GetPermissionByCodeRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.managementPort.getPermissionByCode(req, source)
  }

  async listPermissions(source: DownstreamRequestSource): Promise<ListPermissionsResponse> {
    return this.managementPort.listPermissions(source)
  }

  async listPermissionsByModule(
    req: { module: string },
    source: DownstreamRequestSource
  ): Promise<ListPermissionsResponse> {
    return this.managementPort.listPermissionsByModule(req, source)
  }

  async deleteRole(req: DeleteRoleRequest, source: DownstreamRequestSource): Promise<void> {
    return this.managementPort.deleteRole(req, source)
  }

  async getRoleById(
    req: GetRoleByIdRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.managementPort.getRoleById(req, source)
  }

  async listRoles(source: DownstreamRequestSource): Promise<ListRolesResponse> {
    return this.managementPort.listRoles(source)
  }
}
