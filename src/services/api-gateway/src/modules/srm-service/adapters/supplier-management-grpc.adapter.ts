import { Injectable, OnModuleInit } from '@nestjs/common'
import { SRM_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import {
  BindSupplierToTenantPartyRequest,
  BindSupplierToTenantPartyResponse,
  ChangeSupplierStatusRequest,
  ChangeSupplierStatusResponse,
  CreateSupplierProfileRequest,
  CreateSupplierProfileResponse,
  SupplierManagementServiceClient,
  UpdateSupplierProfileBasicsRequest,
  UpdateSupplierProfileBasicsResponse,
  UpsertSupplierAddressRequest,
  UpsertSupplierAddressResponse,
  UpsertSupplierContactRequest,
  UpsertSupplierContactResponse,
  UpsertSupplierOfferingRequest,
  UpsertSupplierOfferingResponse
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

/** Proxies SRM commands through one dedicated mTLS channel and exact BUSINESS token metadata. */
@Injectable()
export class SupplierManagementGrpcAdapter implements OnModuleInit {
  private svc!: SupplierManagementServiceClient

  constructor(
    private readonly client: GatewaySrmGrpcClient,
    private readonly producer: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.management()
  }

  async createSupplierProfile(
    input: CreateSupplierProfileRequest,
    source: DownstreamRequestSource
  ): Promise<CreateSupplierProfileResponse> {
    return this.call(
      'createSupplierProfile',
      this.svc.createSupplierProfile(
        input,
        await this.metadata(source, SRM_MANAGEMENT_PERMISSION_CODES.CREATE_SUPPLIER_PROFILE)
      )
    )
  }

  async updateSupplierProfileBasics(
    input: UpdateSupplierProfileBasicsRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateSupplierProfileBasicsResponse> {
    return this.call(
      'updateSupplierProfileBasics',
      this.svc.updateSupplierProfileBasics(
        input,
        await this.metadata(source, SRM_MANAGEMENT_PERMISSION_CODES.UPDATE_SUPPLIER_PROFILE_BASICS)
      )
    )
  }

  async bindSupplierToTenantParty(
    input: BindSupplierToTenantPartyRequest,
    source: DownstreamRequestSource
  ): Promise<BindSupplierToTenantPartyResponse> {
    return this.call(
      'bindSupplierToTenantParty',
      this.svc.bindSupplierToTenantParty(
        input,
        await this.metadata(source, SRM_MANAGEMENT_PERMISSION_CODES.BIND_SUPPLIER_TO_TENANT_PARTY)
      )
    )
  }

  async upsertSupplierContact(
    input: UpsertSupplierContactRequest,
    source: DownstreamRequestSource
  ): Promise<UpsertSupplierContactResponse> {
    return this.call(
      'upsertSupplierContact',
      this.svc.upsertSupplierContact(
        input,
        await this.metadata(source, SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_CONTACT)
      )
    )
  }

  async upsertSupplierAddress(
    input: UpsertSupplierAddressRequest,
    source: DownstreamRequestSource
  ): Promise<UpsertSupplierAddressResponse> {
    return this.call(
      'upsertSupplierAddress',
      this.svc.upsertSupplierAddress(
        input,
        await this.metadata(source, SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_ADDRESS)
      )
    )
  }

  async upsertSupplierOffering(
    input: UpsertSupplierOfferingRequest,
    source: DownstreamRequestSource
  ): Promise<UpsertSupplierOfferingResponse> {
    return this.call(
      'upsertSupplierOffering',
      this.svc.upsertSupplierOffering(
        input,
        await this.metadata(source, SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_OFFERING)
      )
    )
  }

  async changeSupplierStatus(
    input: ChangeSupplierStatusRequest,
    source: DownstreamRequestSource
  ): Promise<ChangeSupplierStatusResponse> {
    return this.call(
      'changeSupplierStatus',
      this.svc.changeSupplierStatus(
        input,
        await this.metadata(source, SRM_MANAGEMENT_PERMISSION_CODES.CHANGE_SUPPLIER_STATUS)
      )
    )
  }

  /** Produces exact SRM-audience metadata solely from the verified Gateway session. */
  private metadata(source: DownstreamRequestSource, code: string) {
    return this.producer.forBusinessCall(source, SRM_TARGET_AUDIENCE, [code])
  }

  /** Wraps one generated SRM command observable with the shared transport error contract. */
  private call<TResponse>(method: string, call$: Observable<TResponse>): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** Identifies the Gateway/SRM method pair without injecting authorization metadata. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
