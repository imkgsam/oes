import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  ArchiveCrmAccountRequest,
  ArchiveCrmAccountResponse,
  ClaimCrmAccountRequest,
  ClaimCrmAccountResponse,
  ConvertLeadToProspectCustomerRequest,
  ConvertLeadToProspectCustomerResponse,
  CreateDraftLeadRequest,
  CreateDraftLeadResponse,
  CreateLeadRequest,
  CreateLeadResponse,
  CUSTOMER_MANAGEMENT_SERVICE_NAME,
  CustomerManagementServiceClient,
  DeleteDraftLeadRequest,
  DeleteDraftLeadResponse,
  ReleaseCrmAccountRequest,
  ReleaseCrmAccountResponse,
  SubmitDraftLeadRequest,
  SubmitDraftLeadResponse,
  UpdateCrmAccountIdentifiersRequest,
  UpdateCrmAccountIdentifiersResponse,
  UpdateDraftLeadRequest,
  UpdateDraftLeadResponse
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

  /** createDraftLead forwards one CRM P1 draft capture command. */
  createDraftLead(
    input: Omit<CreateDraftLeadRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateDraftLeadResponse> {
    return this.call(
      'createDraftLead',
      this.svc.createDraftLead(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'create draft crm lead from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** updateDraftLead forwards one CRM P1 draft update command. */
  updateDraftLead(
    input: Omit<UpdateDraftLeadRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpdateDraftLeadResponse> {
    return this.call(
      'updateDraftLead',
      this.svc.updateDraftLead(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'update draft crm lead from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** submitDraftLead forwards one CRM P1 draft submit command. */
  submitDraftLead(
    input: Omit<SubmitDraftLeadRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<SubmitDraftLeadResponse> {
    return this.call(
      'submitDraftLead',
      this.svc.submitDraftLead(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'submit draft crm lead from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** deleteDraftLead forwards one CRM P1 draft hard-delete command. */
  deleteDraftLead(
    input: Omit<DeleteDraftLeadRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<DeleteDraftLeadResponse> {
    return this.call(
      'deleteDraftLead',
      this.svc.deleteDraftLead(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'delete draft crm lead from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** claimCrmAccount forwards one CRM P1 Pool claim command. */
  claimCrmAccount(
    input: Omit<ClaimCrmAccountRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ClaimCrmAccountResponse> {
    return this.call(
      'claimCrmAccount',
      this.svc.claimCrmAccount(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'claim crm pool account from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** releaseCrmAccount forwards one CRM P1 owner release command. */
  releaseCrmAccount(
    input: Omit<ReleaseCrmAccountRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ReleaseCrmAccountResponse> {
    return this.call(
      'releaseCrmAccount',
      this.svc.releaseCrmAccount(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'release crm account to pool from api-gateway'
          )
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** archiveCrmAccount forwards one CRM-owned archive reason command. */
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

  /** updateCrmAccountIdentifiers forwards CRM-owned strong identifier evidence updates. */
  updateCrmAccountIdentifiers(
    input: Omit<
      UpdateCrmAccountIdentifiersRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpdateCrmAccountIdentifiersResponse> {
    return this.call(
      'updateCrmAccountIdentifiers',
      this.svc.updateCrmAccountIdentifiers(
        {
          ...input,
          operatorContext: buildCrmOperatorContext(source),
          traceContext: buildCrmTraceContext(source),
          auditContext: buildCrmAuditContext(
            source,
            input.auditReason ?? 'update crm account identifiers from api-gateway'
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
