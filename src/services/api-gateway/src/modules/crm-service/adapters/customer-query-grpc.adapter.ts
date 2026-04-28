import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  CUSTOMER_QUERY_SERVICE_NAME,
  CustomerQueryServiceClient,
  GetCustomerAccountRequest,
  GetCustomerAccountResponse,
  ListCustomerAddressesRequest,
  ListCustomerAddressesResponse,
  ListCustomerContactsRequest,
  ListCustomerContactsResponse,
  SearchCustomerAccountsRequest,
  SearchCustomerAccountsResponse,
  SearchSelectableCustomersRequest,
  SearchSelectableCustomersResponse
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

  /** searchCustomerAccounts forwards one tenant-scoped CRM customer directory query. */
  searchCustomerAccounts(
    input: Omit<SearchCustomerAccountsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchCustomerAccountsResponse> {
    return this.call(
      'searchCustomerAccounts',
      this.svc.searchCustomerAccounts(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** searchSelectableCustomers forwards one selector-eligible CRM customer query. */
  searchSelectableCustomers(
    input: Omit<SearchSelectableCustomersRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchSelectableCustomersResponse> {
    return this.call(
      'searchSelectableCustomers',
      this.svc.searchSelectableCustomers(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getCustomerAccount forwards one customer-account read needed by the detail aggregate page. */
  getCustomerAccount(
    input: Omit<GetCustomerAccountRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetCustomerAccountResponse> {
    return this.call(
      'getCustomerAccount',
      this.svc.getCustomerAccount(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listCustomerContacts forwards one customer contact-list read. */
  listCustomerContacts(
    input: Omit<ListCustomerContactsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListCustomerContactsResponse> {
    return this.call(
      'listCustomerContacts',
      this.svc.listCustomerContacts(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listCustomerAddresses forwards one customer address-list read. */
  listCustomerAddresses(
    input: Omit<ListCustomerAddressesRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListCustomerAddressesResponse> {
    return this.call(
      'listCustomerAddresses',
      this.svc.listCustomerAddresses(
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
