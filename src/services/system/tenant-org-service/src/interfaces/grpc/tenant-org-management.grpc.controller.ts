import { Controller } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import {
  ArchiveOrgUnitRequest,
  ArchiveOrgUnitResponse,
  ArchiveTenantRequest,
  ArchiveTenantResponse,
  CreateOrgUnitRequest,
  CreateOrgUnitResponse,
  CreateTenantRequest,
  CreateTenantResponse,
  MoveOrgUnitRequest,
  MoveOrgUnitResponse,
  ReactivateTenantRequest,
  ReactivateTenantResponse,
  SuspendTenantRequest,
  SuspendTenantResponse,
  TenantOrgManagementServiceController,
  TenantOrgManagementServiceControllerMethods,
  UpdateOrgUnitRequest,
  UpdateOrgUnitResponse,
  UpdateTenantProfileRequest,
  UpdateTenantProfileResponse
} from '@oes/common/generated/tenant_org_service'
import { TenantOrgManagementService } from '../../application/services'

/** TenantOrgManagementGrpcController exposes tenant/org management contracts over gRPC. */
@Controller()
@TenantOrgManagementServiceControllerMethods()
export class TenantOrgManagementGrpcController implements TenantOrgManagementServiceController {
  constructor(private readonly tenantOrgManagementService: TenantOrgManagementService) {}

  async createTenant(
    _request: CreateTenantRequest,
    _metadata?: Metadata
  ): Promise<CreateTenantResponse> {
    const result = await this.tenantOrgManagementService.createTenant({
      code: _request.code ?? '',
      name: _request.name ?? '',
      rootOrgName: _request.rootOrgName ?? ''
    })
    return {
      tenant: mapTenant(result.tenant),
      rootOrgUnit: mapOrgUnit(result.rootOrgUnit)
    }
  }

  async updateTenantProfile(
    _request: UpdateTenantProfileRequest,
    _metadata?: Metadata
  ): Promise<UpdateTenantProfileResponse> {
    const tenant = await this.tenantOrgManagementService.updateTenantProfile({
      tenantId: _request.tenantId ?? '',
      name: _request.name || undefined,
      code: _request.code || undefined
    })
    return { tenant: mapTenant(tenant) }
  }

  async suspendTenant(
    _request: SuspendTenantRequest,
    _metadata?: Metadata
  ): Promise<SuspendTenantResponse> {
    const tenant = await this.tenantOrgManagementService.suspendTenant({
      tenantId: _request.tenantId ?? '',
      reason: _request.reason || undefined
    })
    return { tenant: mapTenant(tenant) }
  }

  async reactivateTenant(
    _request: ReactivateTenantRequest,
    _metadata?: Metadata
  ): Promise<ReactivateTenantResponse> {
    const tenant = await this.tenantOrgManagementService.reactivateTenant({
      tenantId: _request.tenantId ?? ''
    })
    return { tenant: mapTenant(tenant) }
  }

  async archiveTenant(
    _request: ArchiveTenantRequest,
    _metadata?: Metadata
  ): Promise<ArchiveTenantResponse> {
    const tenant = await this.tenantOrgManagementService.archiveTenant({
      tenantId: _request.tenantId ?? '',
      reason: _request.reason || undefined
    })
    return { tenant: mapTenant(tenant) }
  }

  async createOrgUnit(
    _request: CreateOrgUnitRequest,
    _metadata?: Metadata
  ): Promise<CreateOrgUnitResponse> {
    const orgUnit = await this.tenantOrgManagementService.createOrgUnit({
      tenantId: _request.tenantId ?? '',
      parentOrgId: _request.parentOrgId ?? '',
      name: _request.name ?? '',
      type: _request.type ?? '',
      sortOrder: _request.sortOrder,
      organizationPartyId: _request.organizationPartyId?.trim() || undefined
    })
    return { orgUnit: mapOrgUnit(orgUnit) }
  }

  async updateOrgUnit(
    _request: UpdateOrgUnitRequest,
    _metadata?: Metadata
  ): Promise<UpdateOrgUnitResponse> {
    const hasOrganizationPartyId = Object.prototype.hasOwnProperty.call(
      _request,
      'organizationPartyId'
    )
    const orgUnit = await this.tenantOrgManagementService.updateOrgUnit({
      tenantId: _request.tenantId ?? '',
      orgUnitId: _request.orgUnitId ?? '',
      name: _request.name || undefined,
      type: _request.type || undefined,
      sortOrder: _request.sortOrder,
      organizationPartyId: hasOrganizationPartyId
        ? (_request.organizationPartyId?.trim() || null)
        : undefined
    })
    return { orgUnit: mapOrgUnit(orgUnit) }
  }

  async moveOrgUnit(
    _request: MoveOrgUnitRequest,
    _metadata?: Metadata
  ): Promise<MoveOrgUnitResponse> {
    const orgUnit = await this.tenantOrgManagementService.moveOrgUnit({
      tenantId: _request.tenantId ?? '',
      orgUnitId: _request.orgUnitId ?? '',
      newParentOrgId: _request.newParentOrgId ?? ''
    })
    return { orgUnit: mapOrgUnit(orgUnit) }
  }

  async archiveOrgUnit(
    _request: ArchiveOrgUnitRequest,
    _metadata?: Metadata
  ): Promise<ArchiveOrgUnitResponse> {
    const orgUnit = await this.tenantOrgManagementService.archiveOrgUnit({
      tenantId: _request.tenantId ?? '',
      orgUnitId: _request.orgUnitId ?? '',
      reason: _request.reason || undefined
    })
    return { orgUnit: mapOrgUnit(orgUnit) }
  }
}

/** mapTenant converts application tenant summaries to gRPC tenant summaries. */
function mapTenant(tenant: {
  id: string
  code: string
  name: string
  status: string
  rootOrgId: string | null
}) {
  return {
    id: tenant.id,
    code: tenant.code,
    name: tenant.name,
    status: String(tenant.status),
    rootOrgId: tenant.rootOrgId ?? ''
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
  organizationPartyId: string | null
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
    organizationPartyId: orgUnit.organizationPartyId ?? ''
  }
}
