import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GetSupplierHandler } from '../application/queries/get-supplier.handler'
import { ListSupplierAddressesHandler } from '../application/queries/list-supplier-addresses.handler'
import { ListSupplierContactsHandler } from '../application/queries/list-supplier-contacts.handler'
import { ListSupplierOfferingsByItemHandler } from '../application/queries/list-supplier-offerings-by-item.handler'
import { ListSupplierOfferingsBySupplierHandler } from '../application/queries/list-supplier-offerings-by-supplier.handler'
import { SearchSuppliersHandler } from '../application/queries/search-suppliers.handler'
import { SupplierQueryGrpcController } from '../interfaces/grpc/supplier-query.grpc.controller'

/** SrmQueryModule wires the phase 1 SRM query handlers and gRPC controller surface. */
@Module({
  imports: [CqrsModule],
  providers: [
    ValidatingQueryBus,
    GetSupplierHandler,
    SearchSuppliersHandler,
    ListSupplierContactsHandler,
    ListSupplierAddressesHandler,
    ListSupplierOfferingsBySupplierHandler,
    ListSupplierOfferingsByItemHandler
  ],
  controllers: [SupplierQueryGrpcController]
})
export class SrmQueryModule {}
