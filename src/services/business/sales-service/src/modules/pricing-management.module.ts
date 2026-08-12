import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ChangePriceListStatusHandler } from '../application/commands/change-price-list-status.handler'
import { CreateCustomerPriceAgreementHandler } from '../application/commands/create-customer-price-agreement.handler'
import { CreateCustomerPriceAgreementFromSalesOrderLineHandler } from '../application/commands/create-customer-price-agreement-from-sales-order-line.handler'
import { CreatePriceListHandler } from '../application/commands/create-price-list.handler'
import { PublishCustomerPriceAgreementVersionHandler } from '../application/commands/publish-customer-price-agreement-version.handler'
import { ReplacePriceListLinesHandler } from '../application/commands/replace-price-list-lines.handler'
import { UpdateCustomerPriceAgreementDraftHandler } from '../application/commands/update-customer-price-agreement-draft.handler'
import { UpdatePriceListHandler } from '../application/commands/update-price-list.handler'
import { SalesAuditService } from '../application/services/sales-audit.service'
import { PricingManagementGrpcController } from '../interfaces/grpc/pricing-management.grpc.controller'
import { SalesTrustedExecutionModule } from './sales-trusted-execution.module'

/** PricingManagementModule wires the phase 1 pricing command handlers, audit service, and gRPC management controller. */
@Module({
  imports: [CqrsModule, SalesTrustedExecutionModule],
  providers: [
    ValidatingCommandBus,
    SalesAuditService,
    CreatePriceListHandler,
    UpdatePriceListHandler,
    ReplacePriceListLinesHandler,
    ChangePriceListStatusHandler,
    CreateCustomerPriceAgreementHandler,
    UpdateCustomerPriceAgreementDraftHandler,
    PublishCustomerPriceAgreementVersionHandler,
    CreateCustomerPriceAgreementFromSalesOrderLineHandler
  ],
  controllers: [PricingManagementGrpcController]
})
export class PricingManagementModule {}
