import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  BindCustomerAccountToTenantPartyRequest,
  BindCustomerAccountToTenantPartyResponse,
  ChangeCustomerStatusRequest,
  ChangeCustomerStatusResponse,
  CreateCustomerAccountRequest,
  CreateCustomerAccountResponse,
  CUSTOMER_MANAGEMENT_SERVICE_NAME,
  CustomerManagementServiceClient,
  UpdateCustomerAccountBasicsRequest,
  UpdateCustomerAccountBasicsResponse,
  UpsertCustomerAddressRequest,
  UpsertCustomerAddressResponse,
  UpsertCustomerContactRequest,
  UpsertCustomerContactResponse
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
import {
  buildCrmAuditContext,
  buildCrmOperatorContext,
  buildCrmTraceContext
} from './crm-grpc-context'

const CALLER = 'api-gateway'

interface ManagementInputBase {
  auditReason?: string
}

@Injectable()
// Proxies the frozen CRM phase 1 command RPCs from api-gateway into crm-service.
export class CustomerManagementGrpcAdapter implements OnModuleInit {
  private svc!: CustomerManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.CRM)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<CustomerManagementServiceClient>(
      CUSTOMER_MANAGEMENT_SERVICE_NAME
    )
  }

  /** createCustomerAccount forwards one CRM customer-account shell creation command. */
  createCustomerAccount(
    input: Omit<CreateCustomerAccountRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateCustomerAccountResponse> {
    return this.call(
      'createCustomerAccount',
      this.svc.createCustomerAccount(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'create customer account from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** updateCustomerAccountBasics forwards one basics-only customer mutation command. */
  updateCustomerAccountBasics(
    input: Omit<
      UpdateCustomerAccountBasicsRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpdateCustomerAccountBasicsResponse> {
    return this.call(
      'updateCustomerAccountBasics',
      this.svc.updateCustomerAccountBasics(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'update customer account basics from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** bindCustomerAccountToTenantParty forwards one primary tenant-party binding command. */
  bindCustomerAccountToTenantParty(
    input: Omit<
      BindCustomerAccountToTenantPartyRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<BindCustomerAccountToTenantPartyResponse> {
    return this.call(
      'bindCustomerAccountToTenantParty',
      this.svc.bindCustomerAccountToTenantParty(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'bind customer account to tenant party from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** upsertCustomerContact forwards one contact create-or-update command. */
  upsertCustomerContact(
    input: Omit<UpsertCustomerContactRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpsertCustomerContactResponse> {
    return this.call(
      'upsertCustomerContact',
      this.svc.upsertCustomerContact(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'upsert customer contact from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** upsertCustomerAddress forwards one address create-or-update command. */
  upsertCustomerAddress(
    input: Omit<UpsertCustomerAddressRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpsertCustomerAddressResponse> {
    return this.call(
      'upsertCustomerAddress',
      this.svc.upsertCustomerAddress(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'upsert customer address from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** changeCustomerStatus forwards one explicit customer status mutation command. */
  changeCustomerStatus(
    input: Omit<ChangeCustomerStatusRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ChangeCustomerStatusResponse> {
    return this.call(
      'changeCustomerStatus',
      this.svc.changeCustomerStatus(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'change customer status from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** call wraps one gateway CRM command RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied CRM command. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
