import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  GrpcRequestContextInterceptor,
  WMS_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  AddOrReplaceReceiptLinesRequest,
  AddOrReplaceReceiptLinesResponse,
  CancelReceiptDraftRequest,
  CancelReceiptDraftResponse,
  CreateReceiptDraftRequest,
  CreateReceiptDraftResponse,
  InventoryStatus as ProtoInventoryStatus,
  PostReceiptRequest,
  PostReceiptResponse,
  ReceiptManagementServiceController,
  ReceiptManagementServiceControllerMethods,
  ReceiptPhysicalDiscrepancyType as ProtoReceiptPhysicalDiscrepancyType,
  ReceiptSourceType as ProtoReceiptSourceType,
  ReceiptTrackingRefType as ProtoReceiptTrackingRefType,
  RestrictedStatusReasonCode as ProtoRestrictedStatusReasonCode
} from '@oes/common/generated/wms_service'
import { WmsAuditService } from '../../application/services/wms-audit.service'
import { AddOrReplaceReceiptLinesCommand } from '../../application/commands/add-or-replace-receipt-lines.command'
import { CancelReceiptDraftCommand } from '../../application/commands/cancel-receipt-draft.command'
import { CreateReceiptDraftCommand } from '../../application/commands/create-receipt-draft.command'
import { PostReceiptCommand } from '../../application/commands/post-receipt.command'
import {
  InventoryStatus,
  ReceiptPhysicalDiscrepancyType,
  ReceiptSourceType,
  ReceiptTrackingRefType,
  RestrictedStatusReasonCode
} from '../../domain/models/wms-records'
import { WmsGrpcPresenter } from './wms-grpc.presenter'
import { WmsRpcContextValidator } from './wms-rpc-context.validator'
import { WmsTrustedBusinessExecutionGuard } from '../../modules/wms-trusted-execution.module'

/** WmsManagementGrpcController exposes the phase 1 receipt command contract with local audit envelope recording. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(WmsTrustedBusinessExecutionGuard, WmsRpcContextValidator)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@ReceiptManagementServiceControllerMethods()
export class WmsManagementGrpcController implements ReceiptManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly auditService: WmsAuditService
  ) {}

  async createReceiptDraft(
    request: CreateReceiptDraftRequest
  ): Promise<CreateReceiptDraftResponse> {
    const context = WmsRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'CreateReceiptDraft',
          resourceType: 'receipt',
          targetId: null,
          requestSummary: {
            warehouseId: request.warehouseId ?? '',
            receiptSourceType: request.receiptSourceType ?? 0
          }
        },
        async () =>
          WmsGrpcPresenter.toCreateReceiptDraftResponse(
            await this.commandBus.execute(
              new CreateReceiptDraftCommand({
                tenantId: context.tenantId,
                orgId: context.operatorContext.orgId ?? undefined,
                warehouseId: request.warehouseId ?? '',
                receiptSourceType: toDomainReceiptSourceType(request.receiptSourceType),
                receiptDate: request.receiptDate ?? undefined,
                referencedReceivingExpectationIds: request.referencedReceivingExpectationIds ?? [],
                note: request.note ?? undefined,
                attachmentRefs: request.attachmentRefs ?? []
              })
            )
          )
      )
    )
  }

  async addOrReplaceReceiptLines(
    request: AddOrReplaceReceiptLinesRequest
  ): Promise<AddOrReplaceReceiptLinesResponse> {
    const context = WmsRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'AddOrReplaceReceiptLines',
          resourceType: 'receipt',
          targetId: request.receiptId ?? null,
          requestSummary: {
            receiptId: request.receiptId ?? '',
            lineCount: request.lines?.length ?? 0
          }
        },
        async () =>
          WmsGrpcPresenter.toAddOrReplaceReceiptLinesResponse(
            await this.commandBus.execute(
              new AddOrReplaceReceiptLinesCommand({
                tenantId: context.tenantId,
                receiptId: request.receiptId ?? '',
                lines: (request.lines ?? []).map((line) => ({
                  receiptLineId: line.receiptLineId ?? undefined,
                  itemId: line.itemId ?? '',
                  receivingExpectationId: line.receivingExpectationId ?? undefined,
                  targetLocationId: line.targetLocationId ?? '',
                  confirmedQuantity: line.confirmedQuantity ?? '',
                  uom: line.uom ?? '',
                  inventoryStatus: toDomainInventoryStatus(line.inventoryStatus),
                  restrictedReason: line.restrictedReason
                    ? {
                        reasonCode: toDomainRestrictedStatusReasonCode(
                          line.restrictedReason.reasonCode
                        ),
                        reasonNote: line.restrictedReason.reasonNote ?? undefined
                      }
                    : undefined,
                  trackingRefs: (line.trackingRefs ?? []).map((trackingRef) => ({
                    trackingRefType: toDomainReceiptTrackingRefType(trackingRef.trackingRefType),
                    trackingRefValue: trackingRef.trackingRefValue ?? ''
                  })),
                  physicalDiscrepancy: line.physicalDiscrepancy
                    ? {
                        discrepancyType: toDomainReceiptPhysicalDiscrepancyType(
                          line.physicalDiscrepancy.discrepancyType
                        ),
                        discrepancyQuantity:
                          line.physicalDiscrepancy.discrepancyQuantity ?? undefined,
                        note: line.physicalDiscrepancy.note ?? undefined
                      }
                    : undefined,
                  evidenceAttachmentRefs: line.evidenceAttachmentRefs ?? []
                }))
              })
            )
          )
      )
    )
  }

  async postReceipt(request: PostReceiptRequest): Promise<PostReceiptResponse> {
    const context = WmsRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'PostReceipt',
          resourceType: 'receipt',
          targetId: request.receiptId ?? null,
          requestSummary: {
            receiptId: request.receiptId ?? ''
          }
        },
        async () =>
          WmsGrpcPresenter.toPostReceiptResponse(
            await this.commandBus.execute(
              new PostReceiptCommand({
                tenantId: context.tenantId,
                receiptId: request.receiptId ?? '',
                postComment: request.postComment ?? undefined
              })
            )
          )
      )
    )
  }

  async cancelReceiptDraft(
    request: CancelReceiptDraftRequest
  ): Promise<CancelReceiptDraftResponse> {
    const context = WmsRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'CancelReceiptDraft',
          resourceType: 'receipt',
          targetId: request.receiptId ?? null,
          requestSummary: {
            receiptId: request.receiptId ?? ''
          }
        },
        async () =>
          WmsGrpcPresenter.toCancelReceiptDraftResponse(
            await this.commandBus.execute(
              new CancelReceiptDraftCommand({
                tenantId: context.tenantId,
                receiptId: request.receiptId ?? '',
                cancelReason: request.cancelReason ?? ''
              })
            )
          )
      )
    )
  }

  private runWithContext<T>(
    context: {
      tenantId: string
      operatorContext: {
        operatorId: string
        operatorType: string
        orgId?: string | null
      }
      traceContext: {
        requestId: string
        traceId: string
      }
    },
    work: () => Promise<T>
  ): Promise<T> {
    return work()
  }
}

/** Registers the frozen WMS HUMAN/WEB receipt-management Code on all four command RPCs. */
for (const method of [
  'createReceiptDraft',
  'addOrReplaceReceiptLines',
  'postReceipt',
  'cancelReceiptDraft'
]) {
  AuthorizeBusinessRpc(
    { all: [WMS_MANAGEMENT_PERMISSION_CODES.MANAGE_RECEIPT] },
    { principalType: 'HUMAN', sessionTerminals: ['WEB'] }
  )(
    WmsManagementGrpcController.prototype,
    method,
    Object.getOwnPropertyDescriptor(WmsManagementGrpcController.prototype, method)
  )
}

function toDomainReceiptSourceType(value?: ProtoReceiptSourceType): ReceiptSourceType {
  return value === ProtoReceiptSourceType.RECEIPT_SOURCE_TYPE_RECEIVING_EXPECTATION_REFERENCE
    ? ReceiptSourceType.RECEIVING_EXPECTATION_REFERENCE
    : ReceiptSourceType.MANUAL
}

function toDomainInventoryStatus(value?: ProtoInventoryStatus): InventoryStatus {
  return value === ProtoInventoryStatus.INVENTORY_STATUS_RESTRICTED
    ? InventoryStatus.RESTRICTED
    : InventoryStatus.AVAILABLE
}

function toDomainRestrictedStatusReasonCode(
  value?: ProtoRestrictedStatusReasonCode
): RestrictedStatusReasonCode {
  switch (value) {
    case ProtoRestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_DAMAGED:
      return RestrictedStatusReasonCode.DAMAGED
    case ProtoRestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_QUALITY_HOLD:
      return RestrictedStatusReasonCode.QUALITY_HOLD
    case ProtoRestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_IDENTIFICATION:
      return RestrictedStatusReasonCode.PENDING_IDENTIFICATION
    case ProtoRestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_DECISION:
      return RestrictedStatusReasonCode.PENDING_DECISION
    default:
      return RestrictedStatusReasonCode.OTHER
  }
}

function toDomainReceiptTrackingRefType(
  value?: ProtoReceiptTrackingRefType
): ReceiptTrackingRefType {
  switch (value) {
    case ProtoReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_UNIT_CODE:
      return ReceiptTrackingRefType.UNIT_CODE
    case ProtoReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_EXTERNAL_CODE:
      return ReceiptTrackingRefType.EXTERNAL_CODE
    case ProtoReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_FREE_TEXT:
      return ReceiptTrackingRefType.FREE_TEXT
    default:
      return ReceiptTrackingRefType.BOX_CODE
  }
}

function toDomainReceiptPhysicalDiscrepancyType(
  value?: ProtoReceiptPhysicalDiscrepancyType
): ReceiptPhysicalDiscrepancyType {
  switch (value) {
    case ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_SHORT_RECEIVED:
      return ReceiptPhysicalDiscrepancyType.SHORT_RECEIVED
    case ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OVER_RECEIVED:
      return ReceiptPhysicalDiscrepancyType.OVER_RECEIVED
    case ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_DAMAGED:
      return ReceiptPhysicalDiscrepancyType.DAMAGED
    case ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_WRONG_ITEM:
      return ReceiptPhysicalDiscrepancyType.WRONG_ITEM
    case ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_QUALITY_HOLD:
      return ReceiptPhysicalDiscrepancyType.QUALITY_HOLD
    default:
      return ReceiptPhysicalDiscrepancyType.OTHER
  }
}
