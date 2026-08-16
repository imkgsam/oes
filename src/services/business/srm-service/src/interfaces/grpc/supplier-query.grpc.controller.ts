import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  GrpcRequestContextInterceptor,
  SRM_MANAGEMENT_PERMISSION_CODES,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  GetSupplierRequest,
  GetSupplierResponse,
  ListSupplierAddressesRequest,
  ListSupplierAddressesResponse,
  ListSupplierContactsRequest,
  ListSupplierContactsResponse,
  ListSupplierOfferingsByItemRequest,
  ListSupplierOfferingsByItemResponse,
  ListSupplierOfferingsBySupplierRequest,
  ListSupplierOfferingsBySupplierResponse,
  SearchSuppliersRequest,
  SearchSuppliersResponse,
  SupplierOfferingStatus as ProtoSupplierOfferingStatus,
  SupplierQueryServiceController,
  SupplierQueryServiceControllerMethods,
  SupplierStatus as ProtoSupplierStatus
} from '@oes/common/generated/srm_service'
import { GetSupplierQuery } from '../../application/queries/get-supplier.query'
import { ListSupplierAddressesQuery } from '../../application/queries/list-supplier-addresses.query'
import { ListSupplierContactsQuery } from '../../application/queries/list-supplier-contacts.query'
import { ListSupplierOfferingsByItemQuery } from '../../application/queries/list-supplier-offerings-by-item.query'
import { ListSupplierOfferingsBySupplierQuery } from '../../application/queries/list-supplier-offerings-by-supplier.query'
import { SearchSuppliersQuery } from '../../application/queries/search-suppliers.query'
import { SupplierOfferingStatus, SupplierStatus } from '../../domain/models/srm-records'
import { SupplierGrpcPresenter } from './supplier-grpc.presenter'
import { SupplierRpcContextValidator, trustedTenantId } from './supplier-rpc-context.validator'

/** SupplierQueryGrpcController exposes the phase 1 SRM read-only query contract. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard, SupplierRpcContextValidator)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@SupplierQueryServiceControllerMethods()
export class SupplierQueryGrpcController implements SupplierQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async getSupplier(request: GetSupplierRequest): Promise<GetSupplierResponse> {
    const profile = await this.queryBus.execute(
      new GetSupplierQuery(trustedTenantId(request), request.supplierId ?? '')
    )

    return SupplierGrpcPresenter.toGetSupplierResponse(profile)
  }

  async searchSuppliers(request: SearchSuppliersRequest): Promise<SearchSuppliersResponse> {
    const result = await this.queryBus.execute(
      new SearchSuppliersQuery({
        tenantId: trustedTenantId(request),
        keyword: request.keyword ?? undefined,
        status: toDomainSupplierStatus(request.status),
        tenantPartyId: request.tenantPartyId ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return SupplierGrpcPresenter.toSearchSuppliersResponse(result)
  }

  async listSupplierContacts(
    request: ListSupplierContactsRequest
  ): Promise<ListSupplierContactsResponse> {
    const result = await this.queryBus.execute(
      new ListSupplierContactsQuery(trustedTenantId(request), request.supplierId ?? '')
    )

    return SupplierGrpcPresenter.toListSupplierContactsResponse(result)
  }

  async listSupplierAddresses(
    request: ListSupplierAddressesRequest
  ): Promise<ListSupplierAddressesResponse> {
    const result = await this.queryBus.execute(
      new ListSupplierAddressesQuery(trustedTenantId(request), request.supplierId ?? '')
    )

    return SupplierGrpcPresenter.toListSupplierAddressesResponse(result)
  }

  async listSupplierOfferingsBySupplier(
    request: ListSupplierOfferingsBySupplierRequest
  ): Promise<ListSupplierOfferingsBySupplierResponse> {
    const result = await this.queryBus.execute(
      new ListSupplierOfferingsBySupplierQuery({
        tenantId: trustedTenantId(request),
        supplierId: request.supplierId ?? '',
        status: toDomainSupplierOfferingStatus(request.status),
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return SupplierGrpcPresenter.toListSupplierOfferingsBySupplierResponse(result)
  }

  async listSupplierOfferingsByItem(
    request: ListSupplierOfferingsByItemRequest
  ): Promise<ListSupplierOfferingsByItemResponse> {
    const result = await this.queryBus.execute(
      new ListSupplierOfferingsByItemQuery({
        tenantId: trustedTenantId(request),
        itemId: request.itemId ?? '',
        status: toDomainSupplierOfferingStatus(request.status),
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return SupplierGrpcPresenter.toListSupplierOfferingsByItemResponse(result)
  }
}

/** Registers the frozen SRM HUMAN/WEB query Code matrix outside application behavior. */
for (const [method, code] of Object.entries({
  getSupplier: SRM_MANAGEMENT_PERMISSION_CODES.VIEW_SUPPLIER_DETAIL,
  searchSuppliers: SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_PROFILE,
  listSupplierContacts: SRM_MANAGEMENT_PERMISSION_CODES.VIEW_SUPPLIER_DETAIL,
  listSupplierAddresses: SRM_MANAGEMENT_PERMISSION_CODES.VIEW_SUPPLIER_DETAIL,
  listSupplierOfferingsBySupplier:
    SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_OFFERINGS_BY_SUPPLIER,
  listSupplierOfferingsByItem: SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_OFFERINGS_BY_ITEM
})) {
  AuthorizeBusinessRpc({ all: [code] }, { principalType: 'HUMAN', sessionTerminals: ['WEB'] })(
    SupplierQueryGrpcController.prototype,
    method,
    Object.getOwnPropertyDescriptor(SupplierQueryGrpcController.prototype, method)
  )
}

/** toDomainSupplierStatus maps the generated SRM enum filter into the minimal domain status filter. */
function toDomainSupplierStatus(value?: ProtoSupplierStatus): SupplierStatus | undefined {
  if (value === ProtoSupplierStatus.SUPPLIER_STATUS_ACTIVE) {
    return SupplierStatus.ACTIVE
  }
  if (value === ProtoSupplierStatus.SUPPLIER_STATUS_INACTIVE) {
    return SupplierStatus.INACTIVE
  }
  return undefined
}

/** toDomainSupplierOfferingStatus maps the generated offering enum filter into the minimal domain status filter. */
function toDomainSupplierOfferingStatus(
  value?: ProtoSupplierOfferingStatus
): SupplierOfferingStatus | undefined {
  if (value === ProtoSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE) {
    return SupplierOfferingStatus.ACTIVE
  }
  if (value === ProtoSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_INACTIVE) {
    return SupplierOfferingStatus.INACTIVE
  }
  return undefined
}
