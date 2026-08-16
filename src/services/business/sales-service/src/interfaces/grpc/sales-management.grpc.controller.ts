import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { AuthorizeBusinessRpc, TrustedExecutionGuard } from '@oes/common/authorization'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  CommercialGateName,
  ConvertQuoteVersionToOrderRequest,
  ConvertQuoteVersionToOrderResponse,
  CreateQuoteRequest,
  CreateQuoteResponse,
  PublishQuoteRequest,
  PublishQuoteResponse,
  SalesManagementServiceController,
  SalesManagementServiceControllerMethods,
  SetOrderCommercialGateRequest,
  SetOrderCommercialGateResponse,
  SubmitFulfillmentHandoffRequest,
  SubmitFulfillmentHandoffResponse,
  UpdateQuoteDraftRequest,
  UpdateQuoteDraftResponse
} from '@oes/common/generated/sales_service'
import { CreateQuoteCommand } from '../../application/commands/create-quote.command'
import { UpdateQuoteDraftCommand } from '../../application/commands/update-quote-draft.command'
import { PublishQuoteCommand } from '../../application/commands/publish-quote.command'
import { ConvertQuoteVersionToOrderCommand } from '../../application/commands/convert-quote-version-to-order.command'
import { SetOrderCommercialGateCommand } from '../../application/commands/set-order-commercial-gate.command'
import { SubmitFulfillmentHandoffCommand } from '../../application/commands/submit-fulfillment-handoff.command'
import { SalesAuditService } from '../../application/services/sales-audit.service'
import { SALES_INVALID_ARGUMENT } from '../../common/errors/sales.errors'
import { PriceQuantityDeliverySnapshot, QuoteLineInput } from '../../domain/models/sales-records'
import { SalesCommercialGateName } from '../../domain/models/sales-records'
import { SalesGrpcPresenter } from './sales-grpc.presenter'
import { SalesRpcContextValidator } from './sales-rpc-context.validator'

/** SalesManagementGrpcController exposes the phase 1 sales command contract with local audit envelope recording. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard)
@Controller()
@SalesManagementServiceControllerMethods()
export class SalesManagementGrpcController implements SalesManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly auditService: SalesAuditService
  ) {}

  @AuthorizeBusinessRpc(
    { all: ['sales.quote.create'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async createQuote(request: CreateQuoteRequest): Promise<CreateQuoteResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(request, 'CreateQuote')
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'CreateQuote',
        resourceType: 'quote',
        targetId: null,
        requestSummary: {
          customerTenantPartyId: request.customerTenantPartyId ?? '',
          lineCount: request.draftLines?.length ?? 0
        }
      },
      async () => {
        const quote = await this.commandBus.execute(
          new CreateQuoteCommand({
            tenantId: context.tenantId,
            customerTenantPartyId: request.customerTenantPartyId ?? '',
            opportunityRef: request.opportunityRef
              ? {
                  opportunityId: request.opportunityRef.opportunityId ?? '',
                  opportunityNo: request.opportunityRef.opportunityNo ?? '',
                  opportunityName: request.opportunityRef.opportunityName ?? ''
                }
              : undefined,
            draftLines: (request.draftLines ?? []).map((line) => toDomainQuoteLineInput(line))
          })
        )

        return SalesGrpcPresenter.toCreateQuoteResponse(quote)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: ['sales.quote.update_draft'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async updateQuoteDraft(request: UpdateQuoteDraftRequest): Promise<UpdateQuoteDraftResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(request, 'UpdateQuoteDraft')
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'UpdateQuoteDraft',
        resourceType: 'quote',
        targetId: request.quoteId ?? null,
        requestSummary: {
          quoteId: request.quoteId ?? '',
          lineCount: request.draftMutation?.lines?.length ?? 0
        }
      },
      async () => {
        const quote = await this.commandBus.execute(
          new UpdateQuoteDraftCommand({
            tenantId: context.tenantId,
            quoteId: request.quoteId ?? '',
            draftMutation: {
              customerTenantPartyId: request.draftMutation?.customerTenantPartyId ?? '',
              opportunityRef: request.draftMutation?.opportunityRef
                ? {
                    opportunityId: request.draftMutation.opportunityRef.opportunityId ?? '',
                    opportunityNo: request.draftMutation.opportunityRef.opportunityNo ?? '',
                    opportunityName: request.draftMutation.opportunityRef.opportunityName ?? ''
                  }
                : undefined,
              lines: (request.draftMutation?.lines ?? []).map((line) =>
                toDomainQuoteLineInput(line)
              )
            }
          })
        )

        return {
          quote: SalesGrpcPresenter.toQuote(quote)
        }
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: ['sales.quote.publish'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async publishQuote(request: PublishQuoteRequest): Promise<PublishQuoteResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(request, 'PublishQuote')
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'PublishQuote',
        resourceType: 'quote_version',
        targetId: request.quoteId ?? null,
        requestSummary: {
          quoteId: request.quoteId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new PublishQuoteCommand({
            tenantId: context.tenantId,
            quoteId: request.quoteId ?? ''
          })
        )

        return SalesGrpcPresenter.toPublishQuoteResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: ['sales.quote.convert_to_order'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async convertQuoteVersionToOrder(
    request: ConvertQuoteVersionToOrderRequest
  ): Promise<ConvertQuoteVersionToOrderResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(
      request,
      'ConvertQuoteVersionToOrder'
    )
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'ConvertQuoteVersionToOrder',
        resourceType: 'sales_order',
        targetId: request.quoteVersionId ?? null,
        requestSummary: {
          quoteVersionId: request.quoteVersionId ?? ''
        }
      },
      async () => {
        const order = await this.commandBus.execute(
          new ConvertQuoteVersionToOrderCommand({
            tenantId: context.tenantId,
            quoteVersionId: request.quoteVersionId ?? ''
          })
        )

        return SalesGrpcPresenter.toConvertQuoteVersionToOrderResponse(order)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: ['sales.order.set_commercial_gate'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async setOrderCommercialGate(
    request: SetOrderCommercialGateRequest
  ): Promise<SetOrderCommercialGateResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(
      request,
      'SetOrderCommercialGate'
    )
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'SetOrderCommercialGate',
        resourceType: 'sales_order',
        targetId: request.salesOrderId ?? null,
        requestSummary: {
          salesOrderId: request.salesOrderId ?? '',
          gateName: request.gateName ?? 0,
          allowed: request.allowed ?? false
        }
      },
      async () => {
        const order = await this.commandBus.execute(
          new SetOrderCommercialGateCommand({
            tenantId: context.tenantId,
            salesOrderId: request.salesOrderId ?? '',
            gateName: toDomainGateName(request.gateName),
            allowed: request.allowed ?? false
          })
        )

        return SalesGrpcPresenter.toSetOrderCommercialGateResponse(order)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: ['sales.order.submit_fulfillment_handoff'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async submitFulfillmentHandoff(
    request: SubmitFulfillmentHandoffRequest
  ): Promise<SubmitFulfillmentHandoffResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(
      request,
      'SubmitFulfillmentHandoff'
    )
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'SubmitFulfillmentHandoff',
        resourceType: 'fulfillment_handoff',
        targetId: request.salesOrderId ?? null,
        requestSummary: {
          salesOrderId: request.salesOrderId ?? ''
        }
      },
      async () => {
        const order = await this.commandBus.execute(
          new SubmitFulfillmentHandoffCommand({
            tenantId: context.tenantId,
            salesOrderId: request.salesOrderId ?? ''
          })
        )

        return SalesGrpcPresenter.toSubmitFulfillmentHandoffResponse(order)
      }
    )
  }
}

/** toDomainQuoteLineInput translates one gRPC quote line payload into the shared domain input shape used by draft writes. */
function toDomainQuoteLineInput(
  line: NonNullable<CreateQuoteRequest['draftLines']>[number]
): QuoteLineInput {
  return {
    lineNo: line.lineNo ?? 0,
    itemId: line.itemId ?? '',
    itemSnapshot: {
      itemCode: line.itemSnapshot?.itemCode ?? '',
      itemName: line.itemSnapshot?.itemName ?? ''
    },
    salesConfigSnapshot: {
      salesUom: line.salesConfigSnapshot?.salesUom ?? '',
      salesUnitLabel: line.salesConfigSnapshot?.salesUnitLabel ?? '',
      notes: line.salesConfigSnapshot?.notes ?? ''
    },
    packagingRequirementSnapshot: {
      packageMode: line.packagingRequirementSnapshot?.packageMode ?? '',
      packageLabel: line.packagingRequirementSnapshot?.packageLabel ?? '',
      specialInstructions: line.packagingRequirementSnapshot?.specialInstructions ?? ''
    },
    priceQuantityDeliverySnapshot: toDomainPriceQuantityDeliverySnapshot(
      line.priceQuantityDeliverySnapshot
    ),
    customerItemSnapshot: {
      customerSku: line.customerItemSnapshot?.customerSku ?? '',
      customerModel: line.customerItemSnapshot?.customerModel ?? '',
      customerDisplayName: line.customerItemSnapshot?.customerDisplayName ?? ''
    }
  }
}

/** toDomainPriceQuantityDeliverySnapshot preserves the pricing subtree so publish and convert can keep snapshot copy semantics. */
function toDomainPriceQuantityDeliverySnapshot(
  snapshot?: NonNullable<CreateQuoteRequest['draftLines']>[number]['priceQuantityDeliverySnapshot']
): PriceQuantityDeliverySnapshot {
  return {
    currencyCode: snapshot?.currencyCode ?? '',
    unitPrice: snapshot?.unitPrice ?? '',
    quantity: snapshot?.quantity ?? '',
    deliveryTerm: snapshot?.deliveryTerm ?? '',
    requestedDeliveryDate: snapshot?.requestedDeliveryDate ?? '',
    priceSnapshot: snapshot?.priceSnapshot
      ? {
          currencyCode: snapshot.priceSnapshot.currencyCode as 'USD' | 'CNY',
          unitPriceAmount: snapshot.priceSnapshot.unitPriceAmount ?? '',
          sourceType: toDomainPricingSourceType(snapshot.priceSnapshot.sourceType),
          sourceRefId: snapshot.priceSnapshot.sourceRefId ?? '',
          sourceLineRefId: snapshot.priceSnapshot.sourceLineRefId ?? '',
          sourceVersionNo: snapshot.priceSnapshot.sourceVersionNo ?? 0,
          resolvedAt: snapshot.priceSnapshot.resolvedAt ?? ''
        }
      : null,
    moqSnapshot: snapshot?.moqSnapshot
      ? {
          moqQuantity: snapshot.moqSnapshot.moqQuantity ?? '',
          quantityUomCode: snapshot.moqSnapshot.quantityUomCode ?? '',
          sourceType: toDomainMoqSourceType(snapshot.moqSnapshot.sourceType),
          sourceRefId: snapshot.moqSnapshot.sourceRefId ?? '',
          sourceLineRefId: snapshot.moqSnapshot.sourceLineRefId ?? '',
          sourceVersionNo: snapshot.moqSnapshot.sourceVersionNo ?? 0,
          resolvedAt: snapshot.moqSnapshot.resolvedAt ?? ''
        }
      : null,
    exchangeRateSnapshot: snapshot?.exchangeRateSnapshot
      ? {
          fromCurrencyCode: snapshot.exchangeRateSnapshot.fromCurrencyCode as 'USD' | 'CNY',
          toCurrencyCode: snapshot.exchangeRateSnapshot.toCurrencyCode as 'USD' | 'CNY',
          exchangeRateValue: snapshot.exchangeRateSnapshot.exchangeRateValue ?? '',
          financeRateRef: snapshot.exchangeRateSnapshot.financeRateRef ?? null,
          effectiveAt: snapshot.exchangeRateSnapshot.effectiveAt ?? '',
          snapshottedAt: snapshot.exchangeRateSnapshot.snapshottedAt ?? ''
        }
      : null,
    exceptionPlaceholders: (snapshot?.exceptionPlaceholders ?? []).map((item) => ({
      exceptionType: item.exceptionType === 2 ? 'LOW_MOQ' : 'LOW_PRICE',
      status: item.status === 2 ? 'REQUIRED' : 'NOT_REQUIRED',
      baselineSourceType: item.baselineSourceType === 2 ? 'PRICE_LIST' : 'CUSTOMER_PRICE_AGREEMENT',
      baselineValue: item.baselineValue ?? '',
      actualValue: item.actualValue ?? '',
      currencyCode: item.currencyCode ?? null,
      quantityUomCode: item.quantityUomCode ?? null,
      detectedAt: item.detectedAt ?? ''
    }))
  }
}

function toDomainPricingSourceType(
  value?: number
): 'CUSTOMER_PRICE_AGREEMENT' | 'PRICE_LIST' | 'MANUAL' {
  if (value === 2) {
    return 'PRICE_LIST'
  }
  if (value === 3) {
    return 'MANUAL'
  }
  return 'CUSTOMER_PRICE_AGREEMENT'
}

function toDomainMoqSourceType(value?: number): 'CUSTOMER_PRICE_AGREEMENT' | 'PRICE_LIST' {
  return value === 2 ? 'PRICE_LIST' : 'CUSTOMER_PRICE_AGREEMENT'
}

/** toDomainGateName maps the generated commercial gate enum into the frozen domain gate identifiers. */
function toDomainGateName(value?: number): SalesCommercialGateName {
  switch (value) {
    case CommercialGateName.COMMERCIAL_GATE_NAME_PRODUCTION_GATE:
      return 'production_gate'
    case CommercialGateName.COMMERCIAL_GATE_NAME_STOCKING_GATE:
      return 'stocking_gate'
    case CommercialGateName.COMMERCIAL_GATE_NAME_SHIPPING_GATE:
      return 'shipping_gate'
    default:
      throw ExceptionFactory.application(SALES_INVALID_ARGUMENT, {
        field: 'gateName'
      })
  }
}
