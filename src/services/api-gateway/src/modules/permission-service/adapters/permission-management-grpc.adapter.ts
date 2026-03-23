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
  PagedPermissionsResponse,
  PagedRolesResponse,
  RoleResponse,
  PERMISSION_MANAGEMENT_SERVICE_NAME
} from '@oes/common/generated/permission_service'
import {
  DownstreamGrpcMetadataFactory,
  DownstreamRequestSource
} from '../../../common/grpc/downstream-grpc-metadata.factory'

const CALLER = 'api-gateway'

@Injectable()
export class PermissionManagementGrpcAdapter implements OnModuleInit {
  private svc!: PermissionManagementServiceClient

  constructor(
    @InjectGrpcClient('permission-service')
    private readonly client: ClientGrpc,
    private readonly metadataFactory: DownstreamGrpcMetadataFactory
  ) {}

  onModuleInit() {
    this.svc = this.client.getService<PermissionManagementServiceClient>(
      PERMISSION_MANAGEMENT_SERVICE_NAME
    )
  }

  // Permission methods

  async createPermission(
    req: CreatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.call('createPermission', () =>
      this.svc.createPermission(req, this.metadataFactory.createManagementMetadata(source))
    )
  }

  async deletePermission(
    req: DeletePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('deletePermission', () =>
      this.svc.deletePermission(req, this.metadataFactory.createManagementMetadata(source))
    )
  }

  async getPermissionByCode(
    req: GetPermissionByCodeRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.call('getPermissionByCode', () =>
      this.svc.getPermissionByCode(req, this.metadataFactory.createManagementMetadata(source))
    )
  }

  async listPermissions(source: DownstreamRequestSource): Promise<ListPermissionsResponse> {
    const result = await this.call<PagedPermissionsResponse>('listPermissionsPaged', () =>
      this.svc.listPermissionsPaged(
        { page: 1, pageSize: 1000 },
        this.metadataFactory.createManagementMetadata(source)
      )
    )

    return { permissions: result.permissions }
  }

  async listPermissionsByModule(
    req: { module: string },
    source: DownstreamRequestSource
  ): Promise<ListPermissionsResponse> {
    const result = await this.call<PagedPermissionsResponse>('listPermissionsPaged', () =>
      this.svc.listPermissionsPaged(
        {
          page: 1,
          pageSize: 1000,
          module: req.module
        } as ListPermissionsPagedRequest,
        this.metadataFactory.createManagementMetadata(source)
      )
    )

    return { permissions: result.permissions }
  }

  // Role methods

  async deleteRole(req: DeleteRoleRequest, source: DownstreamRequestSource): Promise<void> {
    await this.call('deleteRole', () =>
      this.svc.deleteRole(req, this.metadataFactory.createManagementMetadata(source))
    )
  }

  async getRoleById(
    req: GetRoleByIdRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('getRoleById', () =>
      this.svc.getRoleById(req, this.metadataFactory.createManagementMetadata(source))
    )
  }

  async listRoles(source: DownstreamRequestSource): Promise<ListRolesResponse> {
    const result = await this.call<PagedRolesResponse>('listRoleInstances', () =>
      this.svc.listRoleInstances(
        { page: 1, pageSize: 1000 } as ListRoleInstancesRequest,
        this.metadataFactory.createManagementMetadata(source)
      )
    )

    return { roles: result.roles }
  }

  private call<T>(method: string, factory: () => any): Promise<T> {
    return safeGrpcCall(factory(), this.opts(method))
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
