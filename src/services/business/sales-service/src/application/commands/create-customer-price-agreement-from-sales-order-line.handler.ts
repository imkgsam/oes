import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  SALES_FAILED_PRECONDITION,
  SALES_NOT_FOUND
} from '../../common/errors/sales.errors'
import {
  CustomerPriceAgreementVersionRecord,
  SalesCurrencyCode
} from '../../domain/models/pricing-records'
import { CustomerPriceAgreementRepository } from '../../domain/repositories/customer-price-agreement.repository'
import { SalesOrderRepository } from '../../domain/repositories/sales-order.repository'
import { buildAgreementLineRecords } from '../support/pricing-support'
import { assertRequiredString } from '../support/sales-assertions'
import { CreateCustomerPriceAgreementFromSalesOrderLineCommand } from './create-customer-price-agreement-from-sales-order-line.command'

/** CreateCustomerPriceAgreementFromSalesOrderLineHandler extracts one draft agreement line from a frozen sales order line snapshot. */
@Injectable()
@CommandHandler(CreateCustomerPriceAgreementFromSalesOrderLineCommand)
export class CreateCustomerPriceAgreementFromSalesOrderLineHandler
  implements
    ICommandHandler<
      CreateCustomerPriceAgreementFromSalesOrderLineCommand,
      CustomerPriceAgreementVersionRecord
    >
{
  constructor(
    @Inject(TOKENS.CUSTOMER_PRICE_AGREEMENT_REPOSITORY)
    private readonly agreementRepository: CustomerPriceAgreementRepository,
    @Inject(TOKENS.SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: SalesOrderRepository
  ) {}

  async execute(
    command: CreateCustomerPriceAgreementFromSalesOrderLineCommand
  ): Promise<CustomerPriceAgreementVersionRecord> {
    assertRequiredString(command.input.tenantId, 'tenantId')
    assertRequiredString(command.input.salesOrderLineId, 'salesOrderLineId')

    const record = await this.salesOrderRepository.findLineById(
      command.input.tenantId,
      command.input.salesOrderLineId
    )
    if (!record) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        salesOrderLineId: command.input.salesOrderLineId
      })
    }

    const pricingSnapshot = record.line.priceQuantityDeliverySnapshot
    if (!pricingSnapshot.priceSnapshot || !pricingSnapshot.moqSnapshot) {
      throw ExceptionFactory.application(SALES_FAILED_PRECONDITION, {
        salesOrderLineId: command.input.salesOrderLineId,
        reason: 'sales order line does not carry a complete pricing snapshot'
      })
    }

    const currencyCode = pricingSnapshot.priceSnapshot.currencyCode as SalesCurrencyCode
    const existing = await this.agreementRepository.findHeadByCustomerCurrency({
      tenantId: record.order.tenantId,
      customerTenantPartyId: record.order.customerTenantPartyId,
      currencyCode
    })
    const versionNo = existing ? (existing.status === 'DRAFT' ? existing.versionNo : existing.versionNo + 1) : 1
    const customerPriceAgreementId = existing?.customerPriceAgreementId ?? randomUUID()

    const nextVersion: CustomerPriceAgreementVersionRecord = {
      id: existing?.status === 'DRAFT' ? existing.id : randomUUID(),
      customerPriceAgreementId,
      tenantId: record.order.tenantId,
      customerTenantPartyId: record.order.customerTenantPartyId,
      currencyCode,
      versionNo,
      status: 'DRAFT',
      publishedAt: null,
      lines: buildAgreementLineRecords({
        customerPriceAgreementId,
        currencyCode,
        versionNo,
        lines: [
          {
            itemId: record.line.itemId,
            brandKey: null,
            unitPriceAmount: pricingSnapshot.priceSnapshot.unitPriceAmount,
            moqQuantity: pricingSnapshot.moqSnapshot.moqQuantity,
            quantityUomCode: pricingSnapshot.moqSnapshot.quantityUomCode
          }
        ]
      })
    }

    return this.agreementRepository.saveVersion(nextVersion)
  }
}
