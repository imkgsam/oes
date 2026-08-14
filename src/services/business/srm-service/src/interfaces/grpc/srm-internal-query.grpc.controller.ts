import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthorizeInternalCall,
  GrpcRequestContextInterceptor,
  SRM_INTERNAL_PERMISSION_CODES
} from '@oes/common/authorization'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  ResolveActiveSupplierOfferingRequest,
  ResolveActiveSupplierOfferingResponse,
  ResolveActiveSupplierRequest,
  ResolveActiveSupplierResponse,
  SrmInternalQueryServiceController,
  SrmInternalQueryServiceControllerMethods,
  SupplierOfferingStatus as ProtoSupplierOfferingStatus,
  SupplierStatus as ProtoSupplierStatus
} from '@oes/common/generated/srm_service'
import { ResolveActiveSupplierOfferingQuery } from '../../application/queries/resolve-active-supplier-offering.query'
import { ResolveActiveSupplierQuery } from '../../application/queries/resolve-active-supplier.query'
import { SrmTrustedInternalExecutionGuard } from '../../modules/srm-trusted-execution.module'
import { SupplierRpcContextValidator, trustedTenantId } from './supplier-rpc-context.validator'

/** Exposes only Procurement's two frozen SRM-owned active eligibility projections. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(SrmTrustedInternalExecutionGuard, SupplierRpcContextValidator)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@SrmInternalQueryServiceControllerMethods()
export class SrmInternalQueryGrpcController implements SrmInternalQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async resolveActiveSupplier(
    request: ResolveActiveSupplierRequest
  ): Promise<ResolveActiveSupplierResponse> {
    const supplier = await this.queryBus.execute(
      new ResolveActiveSupplierQuery(trustedTenantId(request), request.supplierId ?? '')
    )
    return {
      supplierId: supplier.id,
      displayName: supplier.displayName,
      status: ProtoSupplierStatus.SUPPLIER_STATUS_ACTIVE
    }
  }

  async resolveActiveSupplierOffering(
    request: ResolveActiveSupplierOfferingRequest
  ): Promise<ResolveActiveSupplierOfferingResponse> {
    const offering = await this.queryBus.execute(
      new ResolveActiveSupplierOfferingQuery(
        trustedTenantId(request),
        request.supplierId ?? '',
        request.itemId ?? ''
      )
    )
    return {
      supplierOfferingId: offering.supplierOfferingId,
      supplierId: offering.supplierId,
      itemId: offering.itemId,
      status: ProtoSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE
    }
  }
}

AuthorizeInternalCall({ all: [SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER] })(
  SrmInternalQueryGrpcController.prototype,
  'resolveActiveSupplier',
  Object.getOwnPropertyDescriptor(SrmInternalQueryGrpcController.prototype, 'resolveActiveSupplier')
)
AuthorizeInternalCall({
  all: [SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER_OFFERING]
})(
  SrmInternalQueryGrpcController.prototype,
  'resolveActiveSupplierOffering',
  Object.getOwnPropertyDescriptor(
    SrmInternalQueryGrpcController.prototype,
    'resolveActiveSupplierOffering'
  )
)
