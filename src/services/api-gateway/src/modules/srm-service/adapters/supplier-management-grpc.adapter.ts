import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  BindSupplierToTenantPartyRequest,
  BindSupplierToTenantPartyResponse,
  ChangeSupplierStatusRequest,
  ChangeSupplierStatusResponse,
  CreateSupplierProfileRequest,
  CreateSupplierProfileResponse,
  SUPPLIER_MANAGEMENT_SERVICE_NAME,
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
  buildSrmAuditContext,
  buildSrmOperatorContext,
  buildSrmTraceContext
} from './srm-grpc-context'

const CALLER = 'api-gateway'

interface ManagementInputBase {
  auditReason?: string
}

@Injectable()
// Proxies the frozen SRM phase 1 command RPCs from api-gateway into srm-service.
export class SupplierManagementGrpcAdapter implements OnModuleInit {
  private svc!: SupplierManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.SRM)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<SupplierManagementServiceClient>(
      SUPPLIER_MANAGEMENT_SERVICE_NAME
    )
  }

  /** createSupplierProfile forwards one SRM supplier shell creation command. */
  createSupplierProfile(
    input: Omit<CreateSupplierProfileRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateSupplierProfileResponse> {
    return this.call(
      'createSupplierProfile',
      this.svc.createSupplierProfile(
        {
          ...input,
          operatorContext: buildSrmOperatorContext(source),
          traceContext: buildSrmTraceContext(source),
          auditContext: buildSrmAuditContext(
            source,
            input.auditReason ?? 'create supplier profile from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** updateSupplierProfileBasics forwards one basics-only supplier mutation command. */
  updateSupplierProfileBasics(
    input: Omit<
      UpdateSupplierProfileBasicsRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpdateSupplierProfileBasicsResponse> {
    return this.call(
      'updateSupplierProfileBasics',
      this.svc.updateSupplierProfileBasics(
        {
          ...input,
          operatorContext: buildSrmOperatorContext(source),
          traceContext: buildSrmTraceContext(source),
          auditContext: buildSrmAuditContext(
            source,
            input.auditReason ?? 'update supplier profile basics from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** bindSupplierToTenantParty forwards one formal tenant-party binding command. */
  bindSupplierToTenantParty(
    input: Omit<
      BindSupplierToTenantPartyRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<BindSupplierToTenantPartyResponse> {
    return this.call(
      'bindSupplierToTenantParty',
      this.svc.bindSupplierToTenantParty(
        {
          ...input,
          operatorContext: buildSrmOperatorContext(source),
          traceContext: buildSrmTraceContext(source),
          auditContext: buildSrmAuditContext(
            source,
            input.auditReason ?? 'bind supplier profile to tenant party from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** upsertSupplierContact forwards one supplier contact create-or-update command. */
  upsertSupplierContact(
    input: Omit<UpsertSupplierContactRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpsertSupplierContactResponse> {
    return this.call(
      'upsertSupplierContact',
      this.svc.upsertSupplierContact(
        {
          ...input,
          operatorContext: buildSrmOperatorContext(source),
          traceContext: buildSrmTraceContext(source),
          auditContext: buildSrmAuditContext(
            source,
            input.auditReason ?? 'upsert supplier contact from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** upsertSupplierAddress forwards one supplier address create-or-update command. */
  upsertSupplierAddress(
    input: Omit<UpsertSupplierAddressRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpsertSupplierAddressResponse> {
    return this.call(
      'upsertSupplierAddress',
      this.svc.upsertSupplierAddress(
        {
          ...input,
          operatorContext: buildSrmOperatorContext(source),
          traceContext: buildSrmTraceContext(source),
          auditContext: buildSrmAuditContext(
            source,
            input.auditReason ?? 'upsert supplier address from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** upsertSupplierOffering forwards one supplier-to-item offerability command without expanding procurement terms. */
  upsertSupplierOffering(
    input: Omit<
      UpsertSupplierOfferingRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpsertSupplierOfferingResponse> {
    return this.call(
      'upsertSupplierOffering',
      this.svc.upsertSupplierOffering(
        {
          ...input,
          operatorContext: buildSrmOperatorContext(source),
          traceContext: buildSrmTraceContext(source),
          auditContext: buildSrmAuditContext(
            source,
            input.auditReason ?? 'upsert supplier offering from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** changeSupplierStatus forwards one explicit supplier lifecycle status command. */
  changeSupplierStatus(
    input: Omit<ChangeSupplierStatusRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ChangeSupplierStatusResponse> {
    return this.call(
      'changeSupplierStatus',
      this.svc.changeSupplierStatus(
        {
          ...input,
          operatorContext: buildSrmOperatorContext(source),
          traceContext: buildSrmTraceContext(source),
          auditContext: buildSrmAuditContext(
            source,
            input.auditReason ?? 'change supplier status from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** call wraps one gateway SRM command RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied SRM command. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
