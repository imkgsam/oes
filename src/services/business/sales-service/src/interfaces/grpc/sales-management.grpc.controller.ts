import { Controller, UseFilters } from '@nestjs/common'
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
import { SalesCommercialGateName } from '../../domain/models/sales-records'
import { SalesGrpcPresenter } from './sales-grpc.presenter'
import { SalesRpcContextValidator } from './sales-rpc-context.validator'

/** SalesManagementGrpcController exposes the phase 1 sales command contract with local audit envelope recording. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@SalesManagementServiceControllerMethods()
export class SalesManagementGrpcController implements SalesManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly auditService: SalesAuditService
  ) {}

  async createQuote(request: CreateQuoteRequest): Promise<CreateQuoteResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(request)
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
            tenantId: request.tenantId ?? '',
            customerTenantPartyId: request.customerTenantPartyId ?? '',
            opportunityRef: request.opportunityRef
              ? {
                  opportunityId: request.opportunityRef.opportunityId ?? '',
                  opportunityNo: request.opportunityRef.opportunityNo ?? '',
                  opportunityName: request.opportunityRef.opportunityName ?? ''
                }
              : undefined,
            draftLines: (request.draftLines ?? []).map((line) => ({
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
              priceQuantityDeliverySnapshot: {
                currencyCode: line.priceQuantityDeliverySnapshot?.currencyCode ?? '',
                unitPrice: line.priceQuantityDeliverySnapshot?.unitPrice ?? '',
                quantity: line.priceQuantityDeliverySnapshot?.quantity ?? '',
                deliveryTerm: line.priceQuantityDeliverySnapshot?.deliveryTerm ?? '',
                requestedDeliveryDate: line.priceQuantityDeliverySnapshot?.requestedDeliveryDate ?? ''
              },
              customerItemSnapshot: {
                customerSku: line.customerItemSnapshot?.customerSku ?? '',
                customerModel: line.customerItemSnapshot?.customerModel ?? '',
                customerDisplayName: line.customerItemSnapshot?.customerDisplayName ?? ''
              }
            }))
          })
        )

        return SalesGrpcPresenter.toCreateQuoteResponse(quote)
      }
    )
  }

  async updateQuoteDraft(request: UpdateQuoteDraftRequest): Promise<UpdateQuoteDraftResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(request)
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
            tenantId: request.tenantId ?? '',
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
              lines: (request.draftMutation?.lines ?? []).map((line) => ({
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
                priceQuantityDeliverySnapshot: {
                  currencyCode: line.priceQuantityDeliverySnapshot?.currencyCode ?? '',
                  unitPrice: line.priceQuantityDeliverySnapshot?.unitPrice ?? '',
                  quantity: line.priceQuantityDeliverySnapshot?.quantity ?? '',
                  deliveryTerm: line.priceQuantityDeliverySnapshot?.deliveryTerm ?? '',
                  requestedDeliveryDate: line.priceQuantityDeliverySnapshot?.requestedDeliveryDate ?? ''
                },
                customerItemSnapshot: {
                  customerSku: line.customerItemSnapshot?.customerSku ?? '',
                  customerModel: line.customerItemSnapshot?.customerModel ?? '',
                  customerDisplayName: line.customerItemSnapshot?.customerDisplayName ?? ''
                }
              }))
            }
          })
        )

        return {
          quote: SalesGrpcPresenter.toQuote(quote)
        }
      }
    )
  }

  async publishQuote(request: PublishQuoteRequest): Promise<PublishQuoteResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(request)
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
            tenantId: request.tenantId ?? '',
            quoteId: request.quoteId ?? ''
          })
        )

        return SalesGrpcPresenter.toPublishQuoteResponse(result)
      }
    )
  }

  async convertQuoteVersionToOrder(
    request: ConvertQuoteVersionToOrderRequest
  ): Promise<ConvertQuoteVersionToOrderResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(request)
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
            tenantId: request.tenantId ?? '',
            quoteVersionId: request.quoteVersionId ?? ''
          })
        )

        return SalesGrpcPresenter.toConvertQuoteVersionToOrderResponse(order)
      }
    )
  }

  async setOrderCommercialGate(
    request: SetOrderCommercialGateRequest
  ): Promise<SetOrderCommercialGateResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(request)
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
            tenantId: request.tenantId ?? '',
            salesOrderId: request.salesOrderId ?? '',
            gateName: toDomainGateName(request.gateName),
            allowed: request.allowed ?? false
          })
        )

        return SalesGrpcPresenter.toSetOrderCommercialGateResponse(order)
      }
    )
  }

  async submitFulfillmentHandoff(
    request: SubmitFulfillmentHandoffRequest
  ): Promise<SubmitFulfillmentHandoffResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(request)
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
            tenantId: request.tenantId ?? '',
            salesOrderId: request.salesOrderId ?? ''
          })
        )

        return SalesGrpcPresenter.toSubmitFulfillmentHandoffResponse(order)
      }
    )
  }
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
