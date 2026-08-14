import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GetSupplierHandler } from '../application/queries/get-supplier.handler'
import { ListSupplierAddressesHandler } from '../application/queries/list-supplier-addresses.handler'
import { ListSupplierContactsHandler } from '../application/queries/list-supplier-contacts.handler'
import { ListSupplierOfferingsByItemHandler } from '../application/queries/list-supplier-offerings-by-item.handler'
import { ListSupplierOfferingsBySupplierHandler } from '../application/queries/list-supplier-offerings-by-supplier.handler'
import { SearchSuppliersHandler } from '../application/queries/search-suppliers.handler'
import { ResolveActiveSupplierHandler } from '../application/queries/resolve-active-supplier.handler'
import { ResolveActiveSupplierOfferingHandler } from '../application/queries/resolve-active-supplier-offering.handler'
import { SrmInternalQueryGrpcController } from '../interfaces/grpc/srm-internal-query.grpc.controller'
import { SupplierQueryGrpcController } from '../interfaces/grpc/supplier-query.grpc.controller'
import { SrmTrustedExecutionModule } from './srm-trusted-execution.module'

/** SrmQueryModule wires the phase 1 SRM query handlers and gRPC controller surface. */
@Module({
  imports: [CqrsModule, SrmTrustedExecutionModule],
  providers: [
    ValidatingQueryBus,
    GetSupplierHandler,
    SearchSuppliersHandler,
    ListSupplierContactsHandler,
    ListSupplierAddressesHandler,
    ListSupplierOfferingsBySupplierHandler,
    ListSupplierOfferingsByItemHandler,
    ResolveActiveSupplierHandler,
    ResolveActiveSupplierOfferingHandler
  ],
  controllers: [SupplierQueryGrpcController, SrmInternalQueryGrpcController]
})
export class SrmQueryModule {}
