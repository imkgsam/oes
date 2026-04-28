import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  ConvertQuoteVersionToOrderRequest,
  ConvertQuoteVersionToOrderResponse,
  CreateQuoteRequest,
  CreateQuoteResponse,
  PublishQuoteRequest,
  PublishQuoteResponse,
  SALES_MANAGEMENT_SERVICE_NAME,
  SalesManagementServiceClient,
  SubmitFulfillmentHandoffRequest,
  SubmitFulfillmentHandoffResponse,
  UpdateQuoteDraftRequest,
  UpdateQuoteDraftResponse
} from '@oes/common/generated/sales_service'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  buildSalesAuditContext,
  buildSalesOperatorContext,
  buildSalesTraceContext
} from './sales-grpc-context'

const CALLER = 'api-gateway'
const SALES_SERVICE_TOKEN = 'sales-service'

interface ManagementInputBase {
  auditReason?: string
}

@Injectable()
// Proxies the frozen phase 1 sales command RPCs from api-gateway into sales-service.
export class SalesManagementGrpcAdapter implements OnModuleInit {
  private svc!: SalesManagementServiceClient

  constructor(
    @InjectGrpcClient(SALES_SERVICE_TOKEN)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<SalesManagementServiceClient>(
      SALES_MANAGEMENT_SERVICE_NAME
    )
  }

  /** createQuote forwards one quote draft creation command with explicit operator, trace, and audit payloads. */
  createQuote(
    input: Omit<CreateQuoteRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateQuoteResponse> {
    return this.call(
      'createQuote',
      this.svc.createQuote(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source),
          auditContext: buildSalesAuditContext(
            source,
            input.auditReason ?? 'create quote draft from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** updateQuoteDraft forwards one quote draft mutation command. */
  updateQuoteDraft(
    input: Omit<UpdateQuoteDraftRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpdateQuoteDraftResponse> {
    return this.call(
      'updateQuoteDraft',
      this.svc.updateQuoteDraft(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source),
          auditContext: buildSalesAuditContext(
            source,
            input.auditReason ?? 'update quote draft from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** publishQuote forwards one explicit quote publish command. */
  publishQuote(
    input: Omit<PublishQuoteRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<PublishQuoteResponse> {
    return this.call(
      'publishQuote',
      this.svc.publishQuote(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source),
          auditContext: buildSalesAuditContext(
            source,
            input.auditReason ?? 'publish quote from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** convertQuoteVersionToOrder forwards one explicit quote-version-to-order command. */
  convertQuoteVersionToOrder(
    input: Omit<
      ConvertQuoteVersionToOrderRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ConvertQuoteVersionToOrderResponse> {
    return this.call(
      'convertQuoteVersionToOrder',
      this.svc.convertQuoteVersionToOrder(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source),
          auditContext: buildSalesAuditContext(
            source,
            input.auditReason ?? 'convert quote version to order from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** submitFulfillmentHandoff forwards one sales-side handoff submission command. */
  submitFulfillmentHandoff(
    input: Omit<
      SubmitFulfillmentHandoffRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<SubmitFulfillmentHandoffResponse> {
    return this.call(
      'submitFulfillmentHandoff',
      this.svc.submitFulfillmentHandoff(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source),
          auditContext: buildSalesAuditContext(
            source,
            input.auditReason ?? 'submit fulfillment handoff from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** call wraps one gateway sales command RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied sales command. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
