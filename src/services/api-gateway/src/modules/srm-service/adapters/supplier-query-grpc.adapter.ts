import { Injectable, OnModuleInit } from '@nestjs/common'
import { SRM_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
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
  SupplierQueryServiceClient
} from '@oes/common/generated/srm_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { Observable } from 'rxjs'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  GatewaySrmGrpcClient,
  SRM_TARGET_AUDIENCE
} from '../../../common/grpc/gateway-srm-grpc.client'
import { GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc/gateway-trusted-grpc-execution-producer'

const CALLER = 'api-gateway'

/** Proxies SRM query RPCs through one dedicated mTLS channel and exact BUSINESS token metadata. */
@Injectable()
export class SupplierQueryGrpcAdapter implements OnModuleInit {
  private svc!: SupplierQueryServiceClient

  constructor(
    private readonly client: GatewaySrmGrpcClient,
    private readonly producer: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.query()
  }

  async searchSuppliers(
    input: SearchSuppliersRequest,
    source: DownstreamRequestSource
  ): Promise<SearchSuppliersResponse> {
    return this.call(
      'searchSuppliers',
      this.svc.searchSuppliers(
        input,
        await this.metadata(source, SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_PROFILE)
      )
    )
  }

  async getSupplier(
    input: GetSupplierRequest,
    source: DownstreamRequestSource
  ): Promise<GetSupplierResponse> {
    return this.call(
      'getSupplier',
      this.svc.getSupplier(
        input,
        await this.metadata(source, SRM_MANAGEMENT_PERMISSION_CODES.VIEW_SUPPLIER_DETAIL)
      )
    )
  }

  async listSupplierContacts(
    input: ListSupplierContactsRequest,
    source: DownstreamRequestSource
  ): Promise<ListSupplierContactsResponse> {
    return this.call(
      'listSupplierContacts',
      this.svc.listSupplierContacts(
        input,
        await this.metadata(source, SRM_MANAGEMENT_PERMISSION_CODES.VIEW_SUPPLIER_DETAIL)
      )
    )
  }

  async listSupplierAddresses(
    input: ListSupplierAddressesRequest,
    source: DownstreamRequestSource
  ): Promise<ListSupplierAddressesResponse> {
    return this.call(
      'listSupplierAddresses',
      this.svc.listSupplierAddresses(
        input,
        await this.metadata(source, SRM_MANAGEMENT_PERMISSION_CODES.VIEW_SUPPLIER_DETAIL)
      )
    )
  }

  async listSupplierOfferingsBySupplier(
    input: ListSupplierOfferingsBySupplierRequest,
    source: DownstreamRequestSource
  ): Promise<ListSupplierOfferingsBySupplierResponse> {
    return this.call(
      'listSupplierOfferingsBySupplier',
      this.svc.listSupplierOfferingsBySupplier(
        input,
        await this.metadata(
          source,
          SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_OFFERINGS_BY_SUPPLIER
        )
      )
    )
  }

  async listSupplierOfferingsByItem(
    input: ListSupplierOfferingsByItemRequest,
    source: DownstreamRequestSource
  ): Promise<ListSupplierOfferingsByItemResponse> {
    return this.call(
      'listSupplierOfferingsByItem',
      this.svc.listSupplierOfferingsByItem(
        input,
        await this.metadata(source, SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_OFFERINGS_BY_ITEM)
      )
    )
  }

  /** Produces exact SRM-audience metadata solely from the verified Gateway session. */
  private metadata(source: DownstreamRequestSource, code: string) {
    return this.producer.forBusinessCall(source, SRM_TARGET_AUDIENCE, [code])
  }

  /** Wraps one generated SRM query observable with the shared transport error contract. */
  private call<TResponse>(method: string, call$: Observable<TResponse>): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** Identifies the Gateway/SRM method pair without injecting authorization metadata. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
