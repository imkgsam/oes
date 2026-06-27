import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  CheckLeadDuplicateRequest,
  CheckLeadDuplicateResponse,
  CUSTOMER_QUERY_SERVICE_NAME,
  CustomerQueryServiceClient,
  GetCrmAccountRequest,
  GetCrmAccountResponse,
  ListCrmAccountsRequest,
  ListCrmAccountsResponse,
  ListSourceRecordsRequest,
  ListSourceRecordsResponse
} from '@oes/common/generated/crm_service'
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
import { buildCrmOperatorContext, buildCrmTraceContext } from './crm-grpc-context'

const CALLER = 'api-gateway'

@Injectable()
// Proxies the frozen CRM phase 1 query RPCs from api-gateway into crm-service.
export class CustomerQueryGrpcAdapter implements OnModuleInit {
  private svc!: CustomerQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.CRM)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<CustomerQueryServiceClient>(CUSTOMER_QUERY_SERVICE_NAME)
  }

  /** listCrmAccounts forwards one CRM P1 account workspace query. */
  listCrmAccounts(
    input: Omit<ListCrmAccountsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListCrmAccountsResponse> {
    return this.call(
      'listCrmAccounts',
      this.svc.listCrmAccounts(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getCrmAccount forwards one CRM P1 account detail query. */
  getCrmAccount(
    input: Omit<GetCrmAccountRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetCrmAccountResponse> {
    return this.call(
      'getCrmAccount',
      this.svc.getCrmAccount(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listSourceRecords forwards one CRM account source evidence query. */
  listSourceRecords(
    input: Omit<ListSourceRecordsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListSourceRecordsResponse> {
    return this.call(
      'listSourceRecords',
      this.svc.listSourceRecords(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** checkLeadDuplicate forwards one explicit CRM P1 duplicate evidence query. */
  checkLeadDuplicate(
    input: Omit<CheckLeadDuplicateRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<CheckLeadDuplicateResponse> {
    return this.call(
      'checkLeadDuplicate',
      this.svc.checkLeadDuplicate(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** call wraps one gateway CRM query RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied CRM query. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
