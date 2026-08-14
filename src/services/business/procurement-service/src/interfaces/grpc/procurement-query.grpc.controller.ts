import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  GrpcRequestContextInterceptor,
  PROCUREMENT_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
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
import {
  PurchaseOrderStatus,
  PurchaseRequestStatus,
  PurchaseRequestType,
  ReceivingExpectationStatus
} from '../../domain/models/procurement-records'
import { ProcurementGrpcPresenter } from './procurement-grpc.presenter'
import { ProcurementRpcContextValidator } from './procurement-rpc-context.validator'
import { ProcurementTrustedBusinessExecutionGuard } from '../../modules/procurement-trusted-execution.module'

/** ProcurementQueryGrpcController exposes the phase 1 read-only procurement query contract. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(ProcurementTrustedBusinessExecutionGuard, ProcurementRpcContextValidator)
@UseInterceptors(GrpcRequestContextInterceptor)
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

  async getPurchaseRequest(
    request: GetPurchaseRequestRequest
  ): Promise<GetPurchaseRequestResponse> {
    const context = ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toGetPurchaseRequestResponse(
      await this.queryBus.execute(
        new GetPurchaseRequestQuery(context.tenantId, request.purchaseRequestId ?? '')
      )
    )
  }

  async searchPurchaseRequests(
    request: SearchPurchaseRequestsRequest
  ): Promise<SearchPurchaseRequestsResponse> {
    const context = ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toSearchPurchaseRequestsResponse(
      await this.queryBus.execute(
        new SearchPurchaseRequestsQuery({
          tenantId: context.tenantId,
          orgId: context.operatorContext.orgId ?? undefined,
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
    const context = ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toGetPurchaseOrderResponse(
      await this.queryBus.execute(
        new GetPurchaseOrderQuery(context.tenantId, request.purchaseOrderId ?? '')
      )
    )
  }

  async searchPurchaseOrders(
    request: SearchPurchaseOrdersRequest
  ): Promise<SearchPurchaseOrdersResponse> {
    const context = ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toSearchPurchaseOrdersResponse(
      await this.queryBus.execute(
        new SearchPurchaseOrdersQuery({
          tenantId: context.tenantId,
          orgId: context.operatorContext.orgId ?? undefined,
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
    const context = ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toListPurchaseOrderChangesResponse(
      await this.queryBus.execute(
        new ListPurchaseOrderChangesQuery({
          tenantId: context.tenantId,
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
    const context = ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toGetReceivingExpectationResponse(
      await this.queryBus.execute(
        new GetReceivingExpectationQuery(context.tenantId, request.receivingExpectationId ?? '')
      )
    )
  }

  async searchReceivingExpectations(
    request: SearchReceivingExpectationsRequest
  ): Promise<SearchReceivingExpectationsResponse> {
    const context = ProcurementRpcContextValidator.assertQueryContext(request)
    return ProcurementGrpcPresenter.toSearchReceivingExpectationsResponse(
      await this.queryBus.execute(
        new SearchReceivingExpectationsQuery({
          tenantId: context.tenantId,
          orgId: context.operatorContext.orgId ?? undefined,
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

/** Registers the frozen Procurement HUMAN/WEB Code matrix for every BUSINESS query RPC. */
for (const [method, code] of Object.entries({
  getPurchaseRequest: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_PURCHASE_REQUEST,
  searchPurchaseRequests: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_REQUEST,
  getPurchaseOrder: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_PURCHASE_ORDER,
  searchPurchaseOrders: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_ORDER,
  listPurchaseOrderChanges: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_ORDER_CHANGES,
  getReceivingExpectation: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_RECEIVING_EXPECTATION,
  searchReceivingExpectations: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_RECEIVING_EXPECTATION
})) {
  AuthorizeBusinessRpc({ all: [code] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })(
    ProcurementQueryGrpcController.prototype,
    method,
    Object.getOwnPropertyDescriptor(ProcurementQueryGrpcController.prototype, method)
  )
}

function toDomainPurchaseRequestType(
  value?: ProtoPurchaseRequestType
): PurchaseRequestType | undefined {
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

function toDomainPurchaseRequestStatus(
  value?: ProtoPurchaseRequestStatus
): PurchaseRequestStatus | undefined {
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

function toDomainPurchaseOrderStatus(
  value?: ProtoPurchaseOrderStatus
): PurchaseOrderStatus | undefined {
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
