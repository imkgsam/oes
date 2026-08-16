import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { AuthorizeBusinessRpc, TrustedExecutionGuard } from '@oes/common/authorization'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  ChangePriceListStatusRequest,
  ChangePriceListStatusResponse,
  CreateCustomerPriceAgreementFromSalesOrderLineRequest,
  CreateCustomerPriceAgreementFromSalesOrderLineResponse,
  CreateCustomerPriceAgreementRequest,
  CreateCustomerPriceAgreementResponse,
  CreatePriceListRequest,
  CreatePriceListResponse,
  PricingManagementServiceController,
  PricingManagementServiceControllerMethods,
  PublishCustomerPriceAgreementVersionRequest,
  PublishCustomerPriceAgreementVersionResponse,
  ReplacePriceListLinesRequest,
  ReplacePriceListLinesResponse,
  UpdateCustomerPriceAgreementDraftRequest,
  UpdateCustomerPriceAgreementDraftResponse,
  UpdatePriceListRequest,
  UpdatePriceListResponse
} from '@oes/common/generated/sales_service'
import { ChangePriceListStatusCommand } from '../../application/commands/change-price-list-status.command'
import { CreateCustomerPriceAgreementCommand } from '../../application/commands/create-customer-price-agreement.command'
import { CreateCustomerPriceAgreementFromSalesOrderLineCommand } from '../../application/commands/create-customer-price-agreement-from-sales-order-line.command'
import { CreatePriceListCommand } from '../../application/commands/create-price-list.command'
import { PublishCustomerPriceAgreementVersionCommand } from '../../application/commands/publish-customer-price-agreement-version.command'
import { ReplacePriceListLinesCommand } from '../../application/commands/replace-price-list-lines.command'
import { UpdateCustomerPriceAgreementDraftCommand } from '../../application/commands/update-customer-price-agreement-draft.command'
import { UpdatePriceListCommand } from '../../application/commands/update-price-list.command'
import { SalesAuditService } from '../../application/services/sales-audit.service'
import { PricingGrpcPresenter } from './pricing-grpc.presenter'
import { SalesRpcContextValidator } from './sales-rpc-context.validator'

/** PricingManagementGrpcController exposes the phase 1 pricing command contract with local audit envelope recording. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard)
@Controller()
@PricingManagementServiceControllerMethods()
export class PricingManagementGrpcController implements PricingManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly auditService: SalesAuditService
  ) {}

  @AuthorizeBusinessRpc(
    { all: ['sales.pricing.price_list.manage'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async createPriceList(request: CreatePriceListRequest): Promise<CreatePriceListResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(request, 'CreatePriceList')
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'CreatePriceList',
        resourceType: 'price_list',
        targetId: null,
        requestSummary: {
          priceListName: request.priceListName ?? '',
          lineCount: request.initialLines?.length ?? 0
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new CreatePriceListCommand({
            tenantId: context.tenantId,
            priceListName: request.priceListName ?? '',
            priceListType: toDomainPriceListType(request.priceListType) ?? 'STANDARD',
            currencyCode: (request.currencyCode ?? 'USD') as 'USD' | 'CNY',
            effectiveFrom: request.effectiveFrom ?? '',
            effectiveTo: request.effectiveTo ?? undefined,
            initialLines: (request.initialLines ?? []).map((line) => ({
              itemId: line.itemId ?? '',
              brandKey: line.brandKey ?? undefined,
              unitPriceAmount: line.unitPriceAmount ?? '',
              moqQuantity: line.moqQuantity ?? '',
              quantityUomCode: line.quantityUomCode ?? ''
            }))
          })
        )

        return PricingGrpcPresenter.toCreatePriceListResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: ['sales.pricing.price_list.manage'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async updatePriceList(request: UpdatePriceListRequest): Promise<UpdatePriceListResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(request, 'UpdatePriceList')
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'UpdatePriceList',
        resourceType: 'price_list',
        targetId: request.priceListId ?? null,
        requestSummary: {
          priceListId: request.priceListId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new UpdatePriceListCommand({
            tenantId: context.tenantId,
            priceListId: request.priceListId ?? '',
            priceListName: request.priceListName ?? undefined,
            effectiveFrom: request.effectiveFrom ?? undefined,
            effectiveTo: request.effectiveTo ?? undefined
          })
        )

        return PricingGrpcPresenter.toUpdatePriceListResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: ['sales.pricing.price_list.manage'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async replacePriceListLines(
    request: ReplacePriceListLinesRequest
  ): Promise<ReplacePriceListLinesResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(
      request,
      'ReplacePriceListLines'
    )
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'ReplacePriceListLines',
        resourceType: 'price_list',
        targetId: request.priceListId ?? null,
        requestSummary: {
          priceListId: request.priceListId ?? '',
          lineCount: request.lines?.length ?? 0
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new ReplacePriceListLinesCommand({
            tenantId: context.tenantId,
            priceListId: request.priceListId ?? '',
            lines: (request.lines ?? []).map((line) => ({
              itemId: line.itemId ?? '',
              brandKey: line.brandKey ?? undefined,
              unitPriceAmount: line.unitPriceAmount ?? '',
              moqQuantity: line.moqQuantity ?? '',
              quantityUomCode: line.quantityUomCode ?? ''
            }))
          })
        )

        return PricingGrpcPresenter.toReplacePriceListLinesResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: ['sales.pricing.price_list.manage'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async changePriceListStatus(
    request: ChangePriceListStatusRequest
  ): Promise<ChangePriceListStatusResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(
      request,
      'ChangePriceListStatus'
    )
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'ChangePriceListStatus',
        resourceType: 'price_list',
        targetId: request.priceListId ?? null,
        requestSummary: {
          priceListId: request.priceListId ?? '',
          targetStatus: request.targetStatus ?? 0
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new ChangePriceListStatusCommand({
            tenantId: context.tenantId,
            priceListId: request.priceListId ?? '',
            targetStatus: toDomainPriceListStatus(request.targetStatus) ?? 'DRAFT'
          })
        )

        return PricingGrpcPresenter.toChangePriceListStatusResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: ['sales.pricing.customer_agreement.manage'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async createCustomerPriceAgreement(
    request: CreateCustomerPriceAgreementRequest
  ): Promise<CreateCustomerPriceAgreementResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(
      request,
      'CreateCustomerPriceAgreement'
    )
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'CreateCustomerPriceAgreement',
        resourceType: 'customer_price_agreement',
        targetId: null,
        requestSummary: {
          customerTenantPartyId: request.customerTenantPartyId ?? '',
          currencyCode: request.currencyCode ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new CreateCustomerPriceAgreementCommand({
            tenantId: context.tenantId,
            customerTenantPartyId: request.customerTenantPartyId ?? '',
            currencyCode: (request.currencyCode ?? 'USD') as 'USD' | 'CNY',
            initialLines: (request.initialLines ?? []).map((line) => ({
              itemId: line.itemId ?? '',
              brandKey: line.brandKey ?? undefined,
              unitPriceAmount: line.unitPriceAmount ?? '',
              moqQuantity: line.moqQuantity ?? '',
              quantityUomCode: line.quantityUomCode ?? ''
            }))
          })
        )

        return PricingGrpcPresenter.toCreateCustomerPriceAgreementResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: ['sales.pricing.customer_agreement.manage'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async updateCustomerPriceAgreementDraft(
    request: UpdateCustomerPriceAgreementDraftRequest
  ): Promise<UpdateCustomerPriceAgreementDraftResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(
      request,
      'UpdateCustomerPriceAgreementDraft'
    )
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'UpdateCustomerPriceAgreementDraft',
        resourceType: 'customer_price_agreement',
        targetId: request.customerPriceAgreementId ?? null,
        requestSummary: {
          customerPriceAgreementId: request.customerPriceAgreementId ?? '',
          upsertCount: request.draftMutation?.upserts?.length ?? 0,
          removalCount: request.draftMutation?.removals?.length ?? 0
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new UpdateCustomerPriceAgreementDraftCommand({
            tenantId: context.tenantId,
            customerPriceAgreementId: request.customerPriceAgreementId ?? '',
            draftMutation: {
              upserts: (request.draftMutation?.upserts ?? []).map((line) => ({
                itemId: line.itemId ?? '',
                brandKey: line.brandKey ?? undefined,
                unitPriceAmount: line.unitPriceAmount ?? '',
                moqQuantity: line.moqQuantity ?? '',
                quantityUomCode: line.quantityUomCode ?? ''
              })),
              removals: (request.draftMutation?.removals ?? []).map((line) => ({
                itemId: line.itemId ?? '',
                brandKey: line.brandKey ?? undefined
              }))
            }
          })
        )

        return PricingGrpcPresenter.toUpdateCustomerPriceAgreementDraftResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: ['sales.pricing.customer_agreement.manage'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async publishCustomerPriceAgreementVersion(
    request: PublishCustomerPriceAgreementVersionRequest
  ): Promise<PublishCustomerPriceAgreementVersionResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(
      request,
      'PublishCustomerPriceAgreementVersion'
    )
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'PublishCustomerPriceAgreementVersion',
        resourceType: 'customer_price_agreement',
        targetId: request.customerPriceAgreementId ?? null,
        requestSummary: {
          customerPriceAgreementId: request.customerPriceAgreementId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new PublishCustomerPriceAgreementVersionCommand({
            tenantId: context.tenantId,
            customerPriceAgreementId: request.customerPriceAgreementId ?? ''
          })
        )

        return PricingGrpcPresenter.toPublishCustomerPriceAgreementVersionResponse(result)
      }
    )
  }

  @AuthorizeBusinessRpc(
    { all: ['sales.pricing.customer_agreement.manage'] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )
  async createCustomerPriceAgreementFromSalesOrderLine(
    request: CreateCustomerPriceAgreementFromSalesOrderLineRequest
  ): Promise<CreateCustomerPriceAgreementFromSalesOrderLineResponse> {
    const context = SalesRpcContextValidator.assertManagementContext(
      request,
      'CreateCustomerPriceAgreementFromSalesOrderLine'
    )
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'CreateCustomerPriceAgreementFromSalesOrderLine',
        resourceType: 'customer_price_agreement',
        targetId: request.salesOrderLineId ?? null,
        requestSummary: {
          salesOrderLineId: request.salesOrderLineId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new CreateCustomerPriceAgreementFromSalesOrderLineCommand({
            tenantId: context.tenantId,
            salesOrderLineId: request.salesOrderLineId ?? ''
          })
        )

        return PricingGrpcPresenter.toCreateCustomerPriceAgreementFromSalesOrderLineResponse(result)
      }
    )
  }
}

function toDomainPriceListType(value?: number): 'STANDARD' | 'ACTIVITY' | 'EXHIBITION' | undefined {
  if (value === 2) {
    return 'ACTIVITY'
  }
  if (value === 3) {
    return 'EXHIBITION'
  }
  if (value === 1) {
    return 'STANDARD'
  }
  return undefined
}

function toDomainPriceListStatus(value?: number): 'DRAFT' | 'ACTIVE' | 'INACTIVE' | undefined {
  if (value === 2) {
    return 'ACTIVE'
  }
  if (value === 3) {
    return 'INACTIVE'
  }
  if (value === 1) {
    return 'DRAFT'
  }
  return undefined
}
