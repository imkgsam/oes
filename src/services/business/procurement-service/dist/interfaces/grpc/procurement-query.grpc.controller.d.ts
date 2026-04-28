import { ValidatingQueryBus } from '@oes/common/cqrs';
import { GetPurchaseOrderRequest, GetPurchaseOrderResponse, GetPurchaseRequestRequest, GetPurchaseRequestResponse, GetReceivingExpectationRequest, GetReceivingExpectationResponse, ListPurchaseOrderChangesRequest, ListPurchaseOrderChangesResponse, PurchaseOrderQueryServiceController, PurchaseRequestQueryServiceController, ReceivingExpectationQueryServiceController, SearchPurchaseOrdersRequest, SearchPurchaseOrdersResponse, SearchPurchaseRequestsRequest, SearchPurchaseRequestsResponse, SearchReceivingExpectationsRequest, SearchReceivingExpectationsResponse } from '@oes/common/generated/procurement_service';
/** ProcurementQueryGrpcController exposes the phase 1 read-only procurement query contract. */
export declare class ProcurementQueryGrpcController implements PurchaseRequestQueryServiceController, PurchaseOrderQueryServiceController, ReceivingExpectationQueryServiceController {
    private readonly queryBus;
    constructor(queryBus: ValidatingQueryBus);
    getPurchaseRequest(request: GetPurchaseRequestRequest): Promise<GetPurchaseRequestResponse>;
    searchPurchaseRequests(request: SearchPurchaseRequestsRequest): Promise<SearchPurchaseRequestsResponse>;
    getPurchaseOrder(request: GetPurchaseOrderRequest): Promise<GetPurchaseOrderResponse>;
    searchPurchaseOrders(request: SearchPurchaseOrdersRequest): Promise<SearchPurchaseOrdersResponse>;
    listPurchaseOrderChanges(request: ListPurchaseOrderChangesRequest): Promise<ListPurchaseOrderChangesResponse>;
    getReceivingExpectation(request: GetReceivingExpectationRequest): Promise<GetReceivingExpectationResponse>;
    searchReceivingExpectations(request: SearchReceivingExpectationsRequest): Promise<SearchReceivingExpectationsResponse>;
}
