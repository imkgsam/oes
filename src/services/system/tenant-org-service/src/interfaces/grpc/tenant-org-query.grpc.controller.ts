import { Controller, UseGuards, UseInterceptors } from '@nestjs/common'
import { AuthorizeBusinessRpc } from '@oes/common/authorization'
import { TenantOrgFoundationTrustedExecutionGuard } from '../../modules/tenant-org-trusted-execution.module'
import { Metadata } from '@grpc/grpc-js'
import {
  RequirePermissions,
  AuthenticatedOperatorGuard,
  GrpcRequestContextInterceptor,
  InternalServiceGuard,
  PermissionGuard,
  TENANT_ORG_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import {
  GetOrgReferenceSummaryRequest,
  GetOrgReferenceSummaryResponse,
  GetOrgTreeByTenantIdRequest,
  GetOrgTreeByTenantIdResponse,
  GetOrgUnitByIdRequest,
  GetOrgUnitByIdResponse,
  GetTenantByIdRequest,
  GetTenantByIdResponse,
  ListAncestorOrgUnitsRequest,
  ListAncestorOrgUnitsResponse,
  ListDescendantOrgUnitsRequest,
  ListDescendantOrgUnitsResponse,
  ListTenantsRequest,
  ListTenantsResponse,
  TenantOrgQueryServiceController,
  TenantOrgQueryServiceControllerMethods,
  ValidateOrgReferenceRequest,
  ValidateOrgReferenceResponse
} from '@oes/common/generated/tenant_org_service'
import { TenantOrgQueryService } from '../../application/services'

/** TenantOrgQueryGrpcController exposes tenant/org read contracts over gRPC. */
@UseGuards(TenantOrgFoundationTrustedExecutionGuard)
@Controller()
@UseInterceptors(GrpcRequestContextInterceptor)
@TenantOrgQueryServiceControllerMethods()
export class TenantOrgQueryGrpcController implements TenantOrgQueryServiceController {
  constructor(private readonly tenantOrgQueryService: TenantOrgQueryService) {}

  async getTenantById(
    _request: GetTenantByIdRequest,
    _metadata?: Metadata
  ): Promise<GetTenantByIdResponse> {
    const tenant = await this.tenantOrgQueryService.getTenantById(_request.tenantId ?? '')
    return { tenant: tenant ? mapTenant(tenant) : undefined }
  }

  async listTenants(
    _request: ListTenantsRequest,
    _metadata?: Metadata
  ): Promise<ListTenantsResponse> {
    const result = await this.tenantOrgQueryService.listTenants({
      keyword: _request.keyword || undefined,
      status: _request.status || undefined,
      page: _request.page,
      pageSize: _request.pageSize
    })
    return {
      tenants: result.tenants.map(mapTenant),
      total: result.total
    }
  }

  async getOrgTreeByTenantId(
    _request: GetOrgTreeByTenantIdRequest,
    _metadata?: Metadata
  ): Promise<GetOrgTreeByTenantIdResponse> {
    const roots = await this.tenantOrgQueryService.getOrgTreeByTenantId(_request.tenantId ?? '')
    return { roots: roots.map(mapOrgNode) }
  }

  async getOrgUnitById(
    _request: GetOrgUnitByIdRequest,
    _metadata?: Metadata
  ): Promise<GetOrgUnitByIdResponse> {
    const orgUnit = await this.tenantOrgQueryService.getOrgUnitById(
      _request.tenantId ?? '',
      _request.orgUnitId ?? ''
    )
    return { orgUnit: orgUnit ? mapOrgUnit(orgUnit) : undefined }
  }

  async validateOrgReference(
    _request: ValidateOrgReferenceRequest,
    _metadata?: Metadata
  ): Promise<ValidateOrgReferenceResponse> {
    const result = await this.tenantOrgQueryService.validateOrgReference({
      tenantId: _request.tenantId ?? '',
      orgUnitId: _request.orgUnitId ?? '',
      expectedOrgType: _request.expectedOrgType || undefined
    })
    return {
      result: {
        valid: result.valid,
        rejectionReason: result.rejectionReason,
        orgUnitSummary: result.orgUnitSummary ? mapOrgUnit(result.orgUnitSummary) : undefined
      }
    }
  }

  async getOrgReferenceSummary(
    _request: GetOrgReferenceSummaryRequest,
    _metadata?: Metadata
  ): Promise<GetOrgReferenceSummaryResponse> {
    const orgUnit = await this.tenantOrgQueryService.getOrgReferenceSummary(
      _request.tenantId ?? '',
      _request.orgUnitId ?? ''
    )
    return { orgUnit: orgUnit ? mapOrgUnit(orgUnit) : undefined }
  }

  async listAncestorOrgUnits(
    _request: ListAncestorOrgUnitsRequest,
    _metadata?: Metadata
  ): Promise<ListAncestorOrgUnitsResponse> {
    const ancestors = await this.tenantOrgQueryService.listAncestorOrgUnits(
      _request.tenantId ?? '',
      _request.orgUnitId ?? ''
    )
    return { ancestors: ancestors.map(mapOrgUnit) }
  }

  async listDescendantOrgUnits(
    _request: ListDescendantOrgUnitsRequest,
    _metadata?: Metadata
  ): Promise<ListDescendantOrgUnitsResponse> {
    const descendants = await this.tenantOrgQueryService.listDescendantOrgUnits(
      _request.tenantId ?? '',
      _request.orgUnitId ?? '',
      _request.maxDepth
    )
    return { descendants: descendants.map(mapOrgUnit) }
  }
}

/** mapTenant converts application tenant summaries to gRPC tenant summaries. */
function mapTenant(tenant: {
  id: string
  code: string
  employeeCodePrefix: string
  name: string
  status: string
  rootOrgId: string | null
  websiteUrl?: string | null
}) {
  return {
    id: tenant.id,
    code: tenant.code,
    employeeCodePrefix: tenant.employeeCodePrefix,
    name: tenant.name,
    status: String(tenant.status),
    rootOrgId: tenant.rootOrgId ?? '',
    websiteUrl: tenant.websiteUrl ?? ''
  }
}

/** mapOrgUnit converts application org summaries to gRPC org summaries. */
function mapOrgUnit(orgUnit: {
  id: string
  tenantId: string
  parentOrgId: string | null
  name: string
  type: string
  status: string
  path: string
  depth: number
  sortOrder: number
  organizationTenantPartyId: string | null
}) {
  return {
    id: orgUnit.id,
    tenantId: orgUnit.tenantId,
    parentOrgId: orgUnit.parentOrgId ?? '',
    name: orgUnit.name,
    type: String(orgUnit.type),
    status: String(orgUnit.status),
    path: orgUnit.path,
    depth: orgUnit.depth,
    sortOrder: orgUnit.sortOrder,
    organizationTenantPartyId: orgUnit.organizationTenantPartyId ?? ''
  }
}

/** mapOrgNode recursively converts application org tree nodes to gRPC org tree nodes. */
function mapOrgNode(node: {
  orgUnit: Parameters<typeof mapOrgUnit>[0]
  children: Array<{ orgUnit: Parameters<typeof mapOrgUnit>[0]; children: any[] }>
}) {
  return {
    orgUnit: mapOrgUnit(node.orgUnit),
    children: node.children.map(mapOrgNode)
  }
}

/** Applies TenantOrg's frozen BUSINESS Code declaration to each baseline handler. */
function applyTenantOrgDeclaration(method: string, code: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(TenantOrgQueryGrpcController.prototype, method)
  if (!descriptor) throw new Error(`TenantOrg handler is missing: ${method}`)
  AuthorizeBusinessRpc({ all: [code] })(TenantOrgQueryGrpcController.prototype, method, descriptor)
}
applyTenantOrgDeclaration('getTenantById', 'tenant_org.tenant.get_by_id')
applyTenantOrgDeclaration('listTenants', 'tenant_org.tenant.list')
applyTenantOrgDeclaration('getOrgTreeByTenantId', 'tenant_org.org_unit.list_tree')
applyTenantOrgDeclaration('listAncestorOrgUnits', 'tenant_org.org_unit.list_tree')
applyTenantOrgDeclaration('listDescendantOrgUnits', 'tenant_org.org_unit.list_tree')
applyTenantOrgDeclaration('validateOrgReference', 'tenant_org.org_unit.list_tree')
applyTenantOrgDeclaration('getOrgReferenceSummary', 'tenant_org.org_unit.list_tree')
applyTenantOrgDeclaration('getOrgUnitById', 'tenant_org.org_unit.get_by_id')
