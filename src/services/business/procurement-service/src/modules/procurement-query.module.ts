import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GetPurchaseRequestHandler } from '../application/queries/get-purchase-request.handler'
import { SearchPurchaseRequestsHandler } from '../application/queries/search-purchase-requests.handler'
import { GetPurchaseOrderHandler } from '../application/queries/get-purchase-order.handler'
import { SearchPurchaseOrdersHandler } from '../application/queries/search-purchase-orders.handler'
import { ListPurchaseOrderChangesHandler } from '../application/queries/list-purchase-order-changes.handler'
import { GetReceivingExpectationHandler } from '../application/queries/get-receiving-expectation.handler'
import { SearchReceivingExpectationsHandler } from '../application/queries/search-receiving-expectations.handler'
import { ProcurementQueryGrpcController } from '../interfaces/grpc/procurement-query.grpc.controller'

/** ProcurementQueryModule wires the phase 1 procurement query handlers and gRPC controller surface. */
@Module({
  imports: [CqrsModule],
  providers: [
    ValidatingQueryBus,
    GetPurchaseRequestHandler,
    SearchPurchaseRequestsHandler,
    GetPurchaseOrderHandler,
    SearchPurchaseOrdersHandler,
    ListPurchaseOrderChangesHandler,
    GetReceivingExpectationHandler,
    SearchReceivingExpectationsHandler
  ],
  controllers: [ProcurementQueryGrpcController]
})
export class ProcurementQueryModule {}
