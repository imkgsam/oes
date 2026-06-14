import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  ArchiveCrmAccountRequest,
  ArchiveCrmAccountResponse,
  ConvertLeadToProspectCustomerRequest,
  ConvertLeadToProspectCustomerResponse,
  CreateLeadRequest,
  CreateLeadResponse,
  CUSTOMER_MANAGEMENT_SERVICE_NAME,
  CustomerManagementServiceClient,
  RestoreCrmAccountRequest,
  RestoreCrmAccountResponse
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

  /** createLead forwards one CRM P1 active lead creation command. */
  createLead(
    input: Omit<CreateLeadRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateLeadResponse> {
    return this.call(
      'createLead',
      this.svc.createLead(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'create crm lead from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** archiveCrmAccount forwards one CRM P1 soft-archive command. */
  archiveCrmAccount(
    input: Omit<ArchiveCrmAccountRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ArchiveCrmAccountResponse> {
    return this.call(
      'archiveCrmAccount',
      this.svc.archiveCrmAccount(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'archive crm account from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** restoreCrmAccount forwards one CRM P1 soft-restore command. */
  restoreCrmAccount(
    input: Omit<RestoreCrmAccountRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RestoreCrmAccountResponse> {
    return this.call(
      'restoreCrmAccount',
      this.svc.restoreCrmAccount(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'restore crm account from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** convertLeadToProspectCustomer forwards one CRM P1 lead formalization command. */
  convertLeadToProspectCustomer(
    input: Omit<
      ConvertLeadToProspectCustomerRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ConvertLeadToProspectCustomerResponse> {
    return this.call(
      'convertLeadToProspectCustomer',
      this.svc.convertLeadToProspectCustomer(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'convert crm lead to prospect customer from api-gateway'
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
