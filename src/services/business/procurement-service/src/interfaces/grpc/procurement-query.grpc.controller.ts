import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  GetPurchaseOrderRequest,
  GetPurchaseOrderResponse,
  GetPurchaseRequestRequest,
  GetPurchaseRequestResponse,
  GetReceivingExpectationRequest,
  GetReceivingExpectationResponse,
  ListPurchaseOrderChangesRequest,
  ListPurchaseOrderChangesResponse,
  PurchaseOrderQueryServiceController,
  PurchaseOrderQueryServiceControllerMethods,
  PurchaseOrderStatus as ProtoPurchaseOrderStatus,
  PurchaseRequestQueryServiceController,
  PurchaseRequestQueryServiceControllerMethods,
  PurchaseRequestStatus as ProtoPurchaseRequestStatus,
  PurchaseRequestType as ProtoPurchaseRequestType,
  ReceivingExpectationQueryServiceController,
  ReceivingExpectationQueryServiceControllerMethods,
  ReceivingExpectationStatus as ProtoReceivingExpectationStatus,
  SearchPurchaseOrdersRequest,
  SearchPurchaseOrdersResponse,
  SearchPurchaseRequestsRequest,
  SearchPurchaseRequestsResponse,
  SearchReceivingExpectationsRequest,
  SearchReceivingExpectationsResponse
} from '@oes/common/generated/procurement_service'
import { GetPurchaseRequestQuery } from '../../application/queries/get-purchase-request.query'
import { SearchPurchaseRequestsQuery } from '../../application/queries/search-purchase-requests.query'
import { GetPurchaseOrderQuery } from '../../application/queries/get-purchase-order.query'
import { SearchPurchaseOrdersQuery } from '../../application/queries/search-purchase-orders.query'
import { ListPurchaseOrderChangesQuery } from '../../application/queries/list-purchase-order-changes.query'
import { GetReceivingExpectationQuery } from '../../application/queries/get-receiving-expectation.query'
import { SearchReceivingExpectationsQuery } from '../../application/queries/search-receiving-expectations.query'
import { PurchaseOrderStatus, PurchaseRequestStatus, PurchaseRequestType, ReceivingExpectationStatus } from '../../domain/models/procurement-records'
import { ProcurementGrpcPresenter } from './procurement-grpc.presenter'
import { ProcurementRpcContextValidator } from './procurement-rpc-context.validator'

/** ProcurementQueryGrpcController exposes the phase 1 read-only procurement query contract. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@PurchaseRequestQueryServiceControllerMethods()
@PurchaseOrderQueryServiceControllerMethods()
@ReceivingExpectationQueryServiceControllerMethods()
export class ProcurementQueryGrpcController
  implements
    PurchaseRequestQueryServiceController,
    PurchaseOrderQueryServiceController,
    ReceivingExpectationQueryServiceController
{
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async getPurchaseRequest(request: GetPurchaseRequestRequest): Promise<GetPurchaseRequestResponse> {
    ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toGetPurchaseRequestResponse(
      await this.queryBus.execute(
        new GetPurchaseRequestQuery(request.tenantId ?? '', request.purchaseRequestId ?? '')
      )
    )
  }

  async searchPurchaseRequests(
    request: SearchPurchaseRequestsRequest
  ): Promise<SearchPurchaseRequestsResponse> {
    ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toSearchPurchaseRequestsResponse(
      await this.queryBus.execute(
        new SearchPurchaseRequestsQuery({
          tenantId: request.tenantId ?? '',
          orgId: request.orgId ?? undefined,
          keyword: request.keyword ?? undefined,
          requestType: toDomainPurchaseRequestType(request.requestType),
          status: toDomainPurchaseRequestStatus(request.status),
          requesterOperatorId: request.requesterOperatorId ?? undefined,
          itemId: request.itemId ?? undefined,
          purchaseOrderId: request.purchaseOrderId ?? undefined,
          neededByDateFrom: request.neededByDateFrom ?? undefined,
          neededByDateTo: request.neededByDateTo ?? undefined,
          page: request.page ?? undefined,
          pageSize: request.pageSize ?? undefined
        })
      )
    )
  }

  async getPurchaseOrder(request: GetPurchaseOrderRequest): Promise<GetPurchaseOrderResponse> {
    ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toGetPurchaseOrderResponse(
      await this.queryBus.execute(
        new GetPurchaseOrderQuery(request.tenantId ?? '', request.purchaseOrderId ?? '')
      )
    )
  }

  async searchPurchaseOrders(request: SearchPurchaseOrdersRequest): Promise<SearchPurchaseOrdersResponse> {
    ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toSearchPurchaseOrdersResponse(
      await this.queryBus.execute(
        new SearchPurchaseOrdersQuery({
          tenantId: request.tenantId ?? '',
          orgId: request.orgId ?? undefined,
          keyword: request.keyword ?? undefined,
          status: toDomainPurchaseOrderStatus(request.status),
          supplierId: request.supplierId ?? undefined,
          itemId: request.itemId ?? undefined,
          requestNo: request.requestNo ?? undefined,
          issuedFrom: request.issuedFrom ?? undefined,
          issuedTo: request.issuedTo ?? undefined,
          page: request.page ?? undefined,
          pageSize: request.pageSize ?? undefined
        })
      )
    )
  }

  async listPurchaseOrderChanges(
    request: ListPurchaseOrderChangesRequest
  ): Promise<ListPurchaseOrderChangesResponse> {
    ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toListPurchaseOrderChangesResponse(
      await this.queryBus.execute(
        new ListPurchaseOrderChangesQuery({
          tenantId: request.tenantId ?? '',
          purchaseOrderId: request.purchaseOrderId ?? '',
          page: request.page ?? undefined,
          pageSize: request.pageSize ?? undefined
        })
      )
    )
  }

  async getReceivingExpectation(
    request: GetReceivingExpectationRequest
  ): Promise<GetReceivingExpectationResponse> {
    ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toGetReceivingExpectationResponse(
      await this.queryBus.execute(
        new GetReceivingExpectationQuery(request.tenantId ?? '', request.receivingExpectationId ?? '')
      )
    )
  }

  async searchReceivingExpectations(
    request: SearchReceivingExpectationsRequest
  ): Promise<SearchReceivingExpectationsResponse> {
    ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toSearchReceivingExpectationsResponse(
      await this.queryBus.execute(
        new SearchReceivingExpectationsQuery({
          tenantId: request.tenantId ?? '',
          orgId: request.orgId ?? undefined,
          purchaseOrderId: request.purchaseOrderId ?? undefined,
          supplierId: request.supplierId ?? undefined,
          status: toDomainReceivingExpectationStatus(request.status),
          hasOpenDiscrepancy: request.hasOpenDiscrepancy ?? undefined,
          targetWarehouseId: request.targetWarehouseId ?? undefined,
          targetReceivingAddressId: request.targetReceivingAddressId ?? undefined,
          expectedReceiptDateFrom: request.expectedReceiptDateFrom ?? undefined,
          expectedReceiptDateTo: request.expectedReceiptDateTo ?? undefined,
          page: request.page ?? undefined,
          pageSize: request.pageSize ?? undefined
        })
      )
    )
  }
}

function toDomainPurchaseRequestType(value?: ProtoPurchaseRequestType): PurchaseRequestType | undefined {
  if (value === undefined || value === 0) {
    return undefined
  }
  switch (value) {
    case ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_SALES_DEDICATED:
      return PurchaseRequestType.SALES_DEDICATED
    case ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_PRODUCTION_PACKAGING:
      return PurchaseRequestType.PRODUCTION_PACKAGING
    case ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_MAINTENANCE:
      return PurchaseRequestType.MAINTENANCE
    case ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_SAMPLE:
      return PurchaseRequestType.SAMPLE
    default:
      return PurchaseRequestType.DEPARTMENTAL
  }
}

function toDomainPurchaseRequestStatus(value?: ProtoPurchaseRequestStatus): PurchaseRequestStatus | undefined {
  if (value === undefined || value === 0) {
    return undefined
  }
  switch (value) {
    case ProtoPurchaseRequestStatus.PURCHASE_REQUEST_STATUS_SUBMITTED:
      return PurchaseRequestStatus.SUBMITTED
    case ProtoPurchaseRequestStatus.PURCHASE_REQUEST_STATUS_APPROVED:
      return PurchaseRequestStatus.APPROVED
    case ProtoPurchaseRequestStatus.PURCHASE_REQUEST_STATUS_PARTIALLY_CONVERTED:
      return PurchaseRequestStatus.PARTIALLY_CONVERTED
    case ProtoPurchaseRequestStatus.PURCHASE_REQUEST_STATUS_CONVERTED:
      return PurchaseRequestStatus.CONVERTED
    case ProtoPurchaseRequestStatus.PURCHASE_REQUEST_STATUS_REJECTED:
      return PurchaseRequestStatus.REJECTED
    case ProtoPurchaseRequestStatus.PURCHASE_REQUEST_STATUS_CANCELLED:
      return PurchaseRequestStatus.CANCELLED
    default:
      return PurchaseRequestStatus.DRAFT
  }
}

function toDomainPurchaseOrderStatus(value?: ProtoPurchaseOrderStatus): PurchaseOrderStatus | undefined {
  if (value === undefined || value === 0) {
    return undefined
  }
  switch (value) {
    case ProtoPurchaseOrderStatus.PURCHASE_ORDER_STATUS_ISSUED:
      return PurchaseOrderStatus.ISSUED
    case ProtoPurchaseOrderStatus.PURCHASE_ORDER_STATUS_ACKNOWLEDGED:
      return PurchaseOrderStatus.ACKNOWLEDGED
    case ProtoPurchaseOrderStatus.PURCHASE_ORDER_STATUS_CANCELLED:
      return PurchaseOrderStatus.CANCELLED
    default:
      return PurchaseOrderStatus.DRAFT
  }
}

function toDomainReceivingExpectationStatus(
  value?: ProtoReceivingExpectationStatus
): ReceivingExpectationStatus | undefined {
  if (value === undefined || value === 0) {
    return undefined
  }
  switch (value) {
    case ProtoReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_PARTIALLY_RECEIVED:
      return ReceivingExpectationStatus.PARTIALLY_RECEIVED
    case ProtoReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_COMPLETED:
      return ReceivingExpectationStatus.COMPLETED
    case ProtoReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_CANCELLED:
      return ReceivingExpectationStatus.CANCELLED
    default:
      return ReceivingExpectationStatus.OPEN
  }
}
