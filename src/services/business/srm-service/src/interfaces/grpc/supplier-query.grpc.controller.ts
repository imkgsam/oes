import { Controller, UseFilters } from '@nestjs/common'
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
import { SupplierRpcContextValidator } from './supplier-rpc-context.validator'

/** SupplierQueryGrpcController exposes the phase 1 SRM read-only query contract. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@SupplierQueryServiceControllerMethods()
export class SupplierQueryGrpcController implements SupplierQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async getSupplier(request: GetSupplierRequest): Promise<GetSupplierResponse> {
    SupplierRpcContextValidator.assertQueryContext(request)
    const profile = await this.queryBus.execute(
      new GetSupplierQuery(request.tenantId ?? '', request.supplierId ?? '')
    )

    return SupplierGrpcPresenter.toGetSupplierResponse(profile)
  }

  async searchSuppliers(request: SearchSuppliersRequest): Promise<SearchSuppliersResponse> {
    SupplierRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new SearchSuppliersQuery({
        tenantId: request.tenantId ?? '',
        keyword: request.keyword ?? undefined,
        status: toDomainSupplierStatus(request.status),
        tenantPartyId: request.tenantPartyId ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return SupplierGrpcPresenter.toSearchSuppliersResponse(result)
  }

  async listSupplierContacts(request: ListSupplierContactsRequest): Promise<ListSupplierContactsResponse> {
    SupplierRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new ListSupplierContactsQuery(request.tenantId ?? '', request.supplierId ?? '')
    )

    return SupplierGrpcPresenter.toListSupplierContactsResponse(result)
  }

  async listSupplierAddresses(request: ListSupplierAddressesRequest): Promise<ListSupplierAddressesResponse> {
    SupplierRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new ListSupplierAddressesQuery(request.tenantId ?? '', request.supplierId ?? '')
    )

    return SupplierGrpcPresenter.toListSupplierAddressesResponse(result)
  }

  async listSupplierOfferingsBySupplier(
    request: ListSupplierOfferingsBySupplierRequest
  ): Promise<ListSupplierOfferingsBySupplierResponse> {
    SupplierRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new ListSupplierOfferingsBySupplierQuery({
        tenantId: request.tenantId ?? '',
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
    SupplierRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new ListSupplierOfferingsByItemQuery({
        tenantId: request.tenantId ?? '',
        itemId: request.itemId ?? '',
        status: toDomainSupplierOfferingStatus(request.status),
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return SupplierGrpcPresenter.toListSupplierOfferingsByItemResponse(result)
  }
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
