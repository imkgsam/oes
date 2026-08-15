import { Injectable, OnModuleInit } from '@nestjs/common'
import { WMS_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import {
  AddOrReplaceReceiptLinesRequest,
  AddOrReplaceReceiptLinesResponse,
  CancelReceiptDraftRequest,
  CancelReceiptDraftResponse,
  CreateReceiptDraftRequest,
  CreateReceiptDraftResponse,
  PostReceiptRequest,
  PostReceiptResponse,
  ReceiptManagementServiceClient
} from '@oes/common/generated/wms_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { Observable } from 'rxjs'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  GatewayWmsGrpcClient,
  WMS_TARGET_AUDIENCE
} from '../../../common/grpc/gateway-wms-grpc.client'
import { GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc/gateway-trusted-grpc-execution-producer'

const CALLER = 'api-gateway'
type GatewayWmsCommand<T> = T & Record<string, unknown> & { auditReason?: string }

/** Proxies WMS commands through one dedicated mTLS channel and exact BUSINESS tokens. */
@Injectable()
export class WmsManagementGrpcAdapter implements OnModuleInit {
  private receiptSvc!: ReceiptManagementServiceClient

  constructor(
    private readonly client: GatewayWmsGrpcClient,
    private readonly producer: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.receiptSvc = this.client.receiptManagement()
  }

  async createReceiptDraft(
    input: GatewayWmsCommand<CreateReceiptDraftRequest>,
    source: DownstreamRequestSource
  ) {
    return this.call<CreateReceiptDraftResponse>(
      'createReceiptDraft',
      this.receiptSvc.createReceiptDraft(stripLocalAuthority(input), await this.metadata(source))
    )
  }

  async addOrReplaceReceiptLines(
    input: GatewayWmsCommand<AddOrReplaceReceiptLinesRequest>,
    source: DownstreamRequestSource
  ) {
    return this.call<AddOrReplaceReceiptLinesResponse>(
      'addOrReplaceReceiptLines',
      this.receiptSvc.addOrReplaceReceiptLines(
        stripLocalAuthority(input),
        await this.metadata(source)
      )
    )
  }

  async postReceipt(input: GatewayWmsCommand<PostReceiptRequest>, source: DownstreamRequestSource) {
    return this.call<PostReceiptResponse>(
      'postReceipt',
      this.receiptSvc.postReceipt(stripLocalAuthority(input), await this.metadata(source))
    )
  }

  async cancelReceiptDraft(
    input: GatewayWmsCommand<CancelReceiptDraftRequest>,
    source: DownstreamRequestSource
  ) {
    return this.call<CancelReceiptDraftResponse>(
      'cancelReceiptDraft',
      this.receiptSvc.cancelReceiptDraft(stripLocalAuthority(input), await this.metadata(source))
    )
  }

  /** Produces the exact WMS receipt-management token for one verified Gateway session. */
  private metadata(source: DownstreamRequestSource) {
    return this.producer.forBusinessCall(source, WMS_TARGET_AUDIENCE, [
      WMS_MANAGEMENT_PERMISSION_CODES.MANAGE_RECEIPT
    ])
  }

  /** Wraps one generated WMS command observable with the shared error contract. */
  private call<TResponse>(method: string, call$: Observable<TResponse>): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** Identifies the Gateway/WMS method pair without injecting authority. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}

/** Removes route-local and retired authority fields before protobuf serialization. */
function stripLocalAuthority<T extends object>(input: T): T {
  const output = { ...input } as Record<string, unknown>
  for (const field of [
    'tenantId',
    'tenant_id',
    'orgId',
    'org_id',
    'operatorContext',
    'operator_context',
    'traceContext',
    'trace_context',
    'auditContext',
    'audit_context',
    'auditReason'
  ])
    delete output[field]
  return output as T
}
