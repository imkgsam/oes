import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  AddOrReplaceReceiptLinesRequest,
  AddOrReplaceReceiptLinesResponse,
  CancelReceiptDraftRequest,
  CancelReceiptDraftResponse,
  CreateReceiptDraftRequest,
  CreateReceiptDraftResponse,
  RECEIPT_MANAGEMENT_SERVICE_NAME,
  ReceiptManagementServiceClient,
  PostReceiptRequest,
  PostReceiptResponse
} from '@oes/common/generated/wms_service'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  buildWmsAuditContext,
  buildWmsOperatorContext,
  buildWmsTraceContext
} from './wms-grpc-context'

const CALLER = 'api-gateway'

interface ManagementInputBase {
  auditReason?: string
}

/** WmsManagementGrpcAdapter proxies the frozen phase 1 WMS management RPCs from api-gateway into wms-service. */
@Injectable()
export class WmsManagementGrpcAdapter implements OnModuleInit {
  private receiptSvc!: ReceiptManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.WMS)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.receiptSvc = this.client.getService<ReceiptManagementServiceClient>(
      RECEIPT_MANAGEMENT_SERVICE_NAME
    )
  }

  /** createReceiptDraft forwards one receipt draft creation command. */
  createReceiptDraft(
    input: Omit<CreateReceiptDraftRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateReceiptDraftResponse> {
    return this.call(
      'createReceiptDraft',
      this.receiptSvc.createReceiptDraft(
        this.attachManagementContext(input, source, input.auditReason ?? 'create receipt draft from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** addOrReplaceReceiptLines forwards one full-replace receipt-line draft mutation command. */
  addOrReplaceReceiptLines(
    input: Omit<
      AddOrReplaceReceiptLinesRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<AddOrReplaceReceiptLinesResponse> {
    return this.call(
      'addOrReplaceReceiptLines',
      this.receiptSvc.addOrReplaceReceiptLines(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'replace receipt draft lines from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** postReceipt forwards one explicit receipt posting command. */
  postReceipt(
    input: Omit<PostReceiptRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<PostReceiptResponse> {
    return this.call(
      'postReceipt',
      this.receiptSvc.postReceipt(
        this.attachManagementContext(input, source, input.auditReason ?? 'post receipt from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** cancelReceiptDraft forwards one explicit receipt draft cancellation command. */
  cancelReceiptDraft(
    input: Omit<CancelReceiptDraftRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CancelReceiptDraftResponse> {
    return this.call(
      'cancelReceiptDraft',
      this.receiptSvc.cancelReceiptDraft(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'cancel receipt draft from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** attachManagementContext injects the explicit WMS operator, trace, and audit contexts required by the frozen management contract. */
  private attachManagementContext<
    TInput extends {
      auditReason?: string
    }
  >(input: TInput, source: DownstreamRequestSource, defaultReason: string) {
    const { auditReason: _auditReason, ...rest } = input

    return {
      ...rest,
      auditContext: buildWmsAuditContext(source, input.auditReason ?? defaultReason),
      operatorContext: buildWmsOperatorContext(source),
      traceContext: buildWmsTraceContext(source)
    }
  }

  /** call wraps one gateway WMS command RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied WMS command. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
