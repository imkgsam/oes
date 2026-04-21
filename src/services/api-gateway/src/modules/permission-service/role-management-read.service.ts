import { Injectable } from '@nestjs/common'
import {
  GetRoleByIdRequest,
  ListRoleInstancesRequest,
  PagedRolesResponse,
  RoleResponse
} from '@oes/common/generated/permission_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { IdentityQueryGrpcAdapter } from './identity-query-grpc.adapter'
import { PermissionProxyService } from './permission-service.service'

type RoleReadModel = RoleResponse & {
  tenantName?: string
  templateRoleName?: string
}

export interface RoleTenantOption {
  code: string
  id: string
  isActive: boolean
  name: string
}

@Injectable()
// Builds the role-management HTTP read model with tenant and source-template labels ready for the UI.
export class RoleManagementReadService {
  constructor(
    private readonly permissionService: PermissionProxyService,
    private readonly identityAdapter: IdentityQueryGrpcAdapter
  ) {}

  async listRoles(
    req: ListRoleInstancesRequest,
    source: DownstreamRequestSource
  ): Promise<PagedRolesResponse & { roles: RoleReadModel[] }> {
    const result = await this.permissionService.listRoles(req, source)

    return {
      ...result,
      roles: await this.enrichRoles(result.roles ?? [], source)
    }
  }

  async getRoleById(
    req: GetRoleByIdRequest,
    source: DownstreamRequestSource
  ): Promise<RoleReadModel> {
    const role = await this.permissionService.getRoleById(req, source)
    const [enriched] = await this.enrichRoles([role], source)
    return enriched ?? role
  }

  async listTenantOptions(
    req: { keyword?: string; pageSize?: number },
    source: DownstreamRequestSource
  ): Promise<{ tenants: RoleTenantOption[] }> {
    const result = await this.identityAdapter.listTenants(
      {
        keyword: normalize(req.keyword),
        pageSize: req.pageSize ?? 20,
        activeOnly: true
      },
      source
    )

    return {
      tenants: (result.tenants ?? []).map((tenant) => ({
        id: tenant.id ?? '',
        code: tenant.code ?? '',
        name: tenant.name ?? '',
        isActive: tenant.isActive ?? true
      }))
    }
  }

  private async enrichRoles(
    roles: RoleResponse[],
    source: DownstreamRequestSource
  ): Promise<RoleReadModel[]> {
    if (roles.length === 0) {
      return []
    }

    const [tenantNameMap, templateNameMap] = await Promise.all([
      this.loadTenantNames(roles, source),
      this.loadTemplateNames(roles, source)
    ])

    return roles.map((role) => {
      const tenantId = normalize(role.tenantId)
      const templateRoleId = normalize(role.templateRoleId)

      return {
        ...role,
        ...(tenantId ? { tenantName: tenantNameMap.get(tenantId) } : {}),
        ...(templateRoleId
          ? { templateRoleName: templateNameMap.get(templateRoleId) }
          : {})
      }
    })
  }

  private async loadTenantNames(
    roles: RoleResponse[],
    source: DownstreamRequestSource
  ): Promise<Map<string, string>> {
    const tenantIds = [
      ...new Set(roles.map((role) => normalize(role.tenantId)).filter(Boolean))
    ] as string[]

    const entries = await Promise.all(
      tenantIds.map(async (tenantId) => {
        const result = await this.identityAdapter.getTenantById(tenantId, source)
        return [tenantId, normalize(result.tenant?.name) ?? ''] as const
      })
    )

    return new Map(entries.filter(([, name]) => Boolean(name)))
  }

  private async loadTemplateNames(
    roles: RoleResponse[],
    source: DownstreamRequestSource
  ): Promise<Map<string, string>> {
    const templateRoleIds = [
      ...new Set(
        roles.map((role) => normalize(role.templateRoleId)).filter(Boolean)
      )
    ] as string[]

    const results = await Promise.allSettled(
      templateRoleIds.map((templateRoleId) =>
        this.permissionService.getRoleTemplateById({ id: templateRoleId }, source)
      )
    )

    const entries = results.flatMap((result, index) => {
      const templateRoleId = templateRoleIds[index]
      if (
        !templateRoleId ||
        result.status !== 'fulfilled' ||
        !normalize(result.value.name)
      ) {
        return []
      }

      return [[templateRoleId, normalize(result.value.name)!] as const]
    })

    return new Map(entries)
  }
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
