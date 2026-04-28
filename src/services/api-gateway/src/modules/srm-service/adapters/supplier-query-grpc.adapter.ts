import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GetSupplierRequest,
  GetSupplierResponse,
  ListSupplierAddressesRequest,
  ListSupplierAddressesResponse,
  ListSupplierContactsRequest,
  ListSupplierContactsResponse,
  ListSupplierOfferingsByItemRequest,
  ListSupplierOfferingsByItemResponse,
  ListSupplierOfferingsBySupplierRequest,
  ListSupplierOfferingsBySupplierResponse,
  SearchSuppliersRequest,
  SearchSuppliersResponse,
  SUPPLIER_QUERY_SERVICE_NAME,
  SupplierQueryServiceClient
} from '@oes/common/generated/srm_service'
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
import { buildSrmOperatorContext, buildSrmTraceContext } from './srm-grpc-context'

const CALLER = 'api-gateway'

@Injectable()
// Proxies the frozen SRM phase 1 query RPCs from api-gateway into srm-service.
export class SupplierQueryGrpcAdapter implements OnModuleInit {
  private svc!: SupplierQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.SRM)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<SupplierQueryServiceClient>(SUPPLIER_QUERY_SERVICE_NAME)
  }

  /** searchSuppliers forwards one tenant-scoped SRM supplier directory query. */
  searchSuppliers(
    input: Omit<SearchSuppliersRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchSuppliersResponse> {
    return this.call(
      'searchSuppliers',
      this.svc.searchSuppliers(
        {
          ...input,
          operatorContext: buildSrmOperatorContext(source),
          traceContext: buildSrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getSupplier forwards one SRM supplier shell read needed by the detail aggregate page. */
  getSupplier(
    input: Omit<GetSupplierRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetSupplierResponse> {
    return this.call(
      'getSupplier',
      this.svc.getSupplier(
        {
          ...input,
          operatorContext: buildSrmOperatorContext(source),
          traceContext: buildSrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listSupplierContacts forwards one supplier contact-list read. */
  listSupplierContacts(
    input: Omit<ListSupplierContactsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListSupplierContactsResponse> {
    return this.call(
      'listSupplierContacts',
      this.svc.listSupplierContacts(
        {
          ...input,
          operatorContext: buildSrmOperatorContext(source),
          traceContext: buildSrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listSupplierAddresses forwards one supplier address-list read. */
  listSupplierAddresses(
    input: Omit<ListSupplierAddressesRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListSupplierAddressesResponse> {
    return this.call(
      'listSupplierAddresses',
      this.svc.listSupplierAddresses(
        {
          ...input,
          operatorContext: buildSrmOperatorContext(source),
          traceContext: buildSrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listSupplierOfferingsBySupplier forwards one supplier offering page query keyed by supplierId. */
  listSupplierOfferingsBySupplier(
    input: Omit<ListSupplierOfferingsBySupplierRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListSupplierOfferingsBySupplierResponse> {
    return this.call(
      'listSupplierOfferingsBySupplier',
      this.svc.listSupplierOfferingsBySupplier(
        {
          ...input,
          operatorContext: buildSrmOperatorContext(source),
          traceContext: buildSrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listSupplierOfferingsByItem forwards one supplier offering page query keyed by itemId. */
  listSupplierOfferingsByItem(
    input: Omit<ListSupplierOfferingsByItemRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListSupplierOfferingsByItemResponse> {
    return this.call(
      'listSupplierOfferingsByItem',
      this.svc.listSupplierOfferingsByItem(
        {
          ...input,
          operatorContext: buildSrmOperatorContext(source),
          traceContext: buildSrmTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** call wraps one gateway SRM query RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied SRM query. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
