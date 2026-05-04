import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  ChangePriceListStatusRequest,
  ChangePriceListStatusResponse,
  CreateCustomerPriceAgreementFromSalesOrderLineRequest,
  CreateCustomerPriceAgreementFromSalesOrderLineResponse,
  CreateCustomerPriceAgreementRequest,
  CreateCustomerPriceAgreementResponse,
  CreatePriceListRequest,
  CreatePriceListResponse,
  PRICING_MANAGEMENT_SERVICE_NAME,
  PricingManagementServiceClient,
  PublishCustomerPriceAgreementVersionRequest,
  PublishCustomerPriceAgreementVersionResponse,
  ReplacePriceListLinesRequest,
  ReplacePriceListLinesResponse,
  UpdateCustomerPriceAgreementDraftRequest,
  UpdateCustomerPriceAgreementDraftResponse,
  UpdatePriceListRequest,
  UpdatePriceListResponse
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
// Proxies the frozen phase 1 pricing command RPCs from api-gateway into sales-service.
export class PricingManagementGrpcAdapter implements OnModuleInit {
  private svc!: PricingManagementServiceClient

  constructor(
    @InjectGrpcClient(SALES_SERVICE_TOKEN)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<PricingManagementServiceClient>(
      PRICING_MANAGEMENT_SERVICE_NAME
    )
  }

  /** createPriceList forwards one price-list creation command. */
  createPriceList(
    input: Omit<CreatePriceListRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreatePriceListResponse> {
    return this.call(
      'createPriceList',
      this.svc.createPriceList(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source),
          auditContext: buildSalesAuditContext(
            source,
            input.auditReason ?? 'create price list from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** updatePriceList forwards one price-list header update command. */
  updatePriceList(
    input: Omit<UpdatePriceListRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpdatePriceListResponse> {
    return this.call(
      'updatePriceList',
      this.svc.updatePriceList(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source),
          auditContext: buildSalesAuditContext(
            source,
            input.auditReason ?? 'update price list from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** replacePriceListLines forwards one whole-table price-list line replacement command. */
  replacePriceListLines(
    input: Omit<
      ReplacePriceListLinesRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ReplacePriceListLinesResponse> {
    return this.call(
      'replacePriceListLines',
      this.svc.replacePriceListLines(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source),
          auditContext: buildSalesAuditContext(
            source,
            input.auditReason ?? 'replace price list lines from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** changePriceListStatus forwards one price-list lifecycle status change command. */
  changePriceListStatus(
    input: Omit<
      ChangePriceListStatusRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ChangePriceListStatusResponse> {
    return this.call(
      'changePriceListStatus',
      this.svc.changePriceListStatus(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source),
          auditContext: buildSalesAuditContext(
            source,
            input.auditReason ?? 'change price list status from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** createCustomerPriceAgreement forwards one agreement draft creation command. */
  createCustomerPriceAgreement(
    input: Omit<
      CreateCustomerPriceAgreementRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateCustomerPriceAgreementResponse> {
    return this.call(
      'createCustomerPriceAgreement',
      this.svc.createCustomerPriceAgreement(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source),
          auditContext: buildSalesAuditContext(
            source,
            input.auditReason ?? 'create customer price agreement from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** updateCustomerPriceAgreementDraft forwards one agreement draft mutation command. */
  updateCustomerPriceAgreementDraft(
    input: Omit<
      UpdateCustomerPriceAgreementDraftRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpdateCustomerPriceAgreementDraftResponse> {
    return this.call(
      'updateCustomerPriceAgreementDraft',
      this.svc.updateCustomerPriceAgreementDraft(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source),
          auditContext: buildSalesAuditContext(
            source,
            input.auditReason ?? 'update customer price agreement draft from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** publishCustomerPriceAgreementVersion forwards one agreement publish command. */
  publishCustomerPriceAgreementVersion(
    input: Omit<
      PublishCustomerPriceAgreementVersionRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<PublishCustomerPriceAgreementVersionResponse> {
    return this.call(
      'publishCustomerPriceAgreementVersion',
      this.svc.publishCustomerPriceAgreementVersion(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source),
          auditContext: buildSalesAuditContext(
            source,
            input.auditReason ?? 'publish customer price agreement from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** createCustomerPriceAgreementFromSalesOrderLine forwards one copy-from-order-line command. */
  createCustomerPriceAgreementFromSalesOrderLine(
    input: Omit<
      CreateCustomerPriceAgreementFromSalesOrderLineRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateCustomerPriceAgreementFromSalesOrderLineResponse> {
    return this.call(
      'createCustomerPriceAgreementFromSalesOrderLine',
      this.svc.createCustomerPriceAgreementFromSalesOrderLine(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source),
          auditContext: buildSalesAuditContext(
            source,
            input.auditReason ?? 'create customer price agreement from sales order line from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** call wraps one gateway pricing command RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied pricing command. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
