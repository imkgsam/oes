import { Injectable, OnModuleInit } from '@nestjs/common'
import { CRM_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
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
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { Observable } from 'rxjs'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  CRM_TARGET_AUDIENCE,
  GatewayCrmGrpcClient
} from '../../../common/grpc/gateway-crm-grpc.client'
import { GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc/gateway-trusted-grpc-execution-producer'

const CALLER = 'api-gateway'
type GatewayCrmRequest<T> = T & Record<string, unknown> & { auditReason?: string }

/** Proxies CRM commands through one dedicated mTLS channel and exact BUSINESS tokens. */
@Injectable()
export class CustomerManagementGrpcAdapter implements OnModuleInit {
  private svc!: CustomerManagementServiceClient

  constructor(
    private readonly client: GatewayCrmGrpcClient,
    private readonly producer: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.customerManagement()
  }

  /** Forwards active lead creation with claims-derived ownership authority. */
  async createLead(
    input: GatewayCrmRequest<CreateLeadRequest>,
    source: DownstreamRequestSource
  ): Promise<CreateLeadResponse> {
    return this.call(
      'createLead',
      this.svc.createLead(
        stripLocalAuthority(input),
        await this.metadata(source, CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT)
      )
    )
  }

  /** Forwards draft lead creation without legacy audit or operator payloads. */
  async createDraftLead(
    input: GatewayCrmRequest<CreateDraftLeadRequest>,
    source: DownstreamRequestSource
  ): Promise<CreateDraftLeadResponse> {
    return this.call(
      'createDraftLead',
      this.svc.createDraftLead(
        stripLocalAuthority(input),
        await this.metadata(source, CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT)
      )
    )
  }

  /** Forwards one draft update through the CRM update Code. */
  async updateDraftLead(
    input: GatewayCrmRequest<UpdateDraftLeadRequest>,
    source: DownstreamRequestSource
  ): Promise<UpdateDraftLeadResponse> {
    return this.call(
      'updateDraftLead',
      this.svc.updateDraftLead(
        stripLocalAuthority(input),
        await this.metadata(source, CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT)
      )
    )
  }

  /** Forwards one draft submit while preserving assignment_intent as business input. */
  async submitDraftLead(
    input: GatewayCrmRequest<SubmitDraftLeadRequest>,
    source: DownstreamRequestSource
  ): Promise<SubmitDraftLeadResponse> {
    return this.call(
      'submitDraftLead',
      this.svc.submitDraftLead(
        stripLocalAuthority(input),
        await this.metadata(source, CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT)
      )
    )
  }

  /** Forwards one draft delete through the CRM update Code. */
  async deleteDraftLead(
    input: GatewayCrmRequest<DeleteDraftLeadRequest>,
    source: DownstreamRequestSource
  ): Promise<DeleteDraftLeadResponse> {
    return this.call(
      'deleteDraftLead',
      this.svc.deleteDraftLead(
        stripLocalAuthority(input),
        await this.metadata(source, CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT)
      )
    )
  }

  /** Forwards one current-subject Pool claim through the exact claim Code. */
  async claimCrmAccount(
    input: GatewayCrmRequest<ClaimCrmAccountRequest>,
    source: DownstreamRequestSource
  ): Promise<ClaimCrmAccountResponse> {
    return this.call(
      'claimCrmAccount',
      this.svc.claimCrmAccount(
        stripLocalAuthority(input),
        await this.metadata(source, CRM_MANAGEMENT_PERMISSION_CODES.CLAIM_CRM_ACCOUNT)
      )
    )
  }

  /** Forwards one current-subject release through the exact release Code. */
  async releaseCrmAccount(
    input: GatewayCrmRequest<ReleaseCrmAccountRequest>,
    source: DownstreamRequestSource
  ): Promise<ReleaseCrmAccountResponse> {
    return this.call(
      'releaseCrmAccount',
      this.svc.releaseCrmAccount(
        stripLocalAuthority(input),
        await this.metadata(source, CRM_MANAGEMENT_PERMISSION_CODES.RELEASE_CRM_ACCOUNT)
      )
    )
  }

  /** Forwards one archive command through the exact manage Code. */
  async archiveCrmAccount(
    input: GatewayCrmRequest<ArchiveCrmAccountRequest>,
    source: DownstreamRequestSource
  ): Promise<ArchiveCrmAccountResponse> {
    return this.call(
      'archiveCrmAccount',
      this.svc.archiveCrmAccount(
        stripLocalAuthority(input),
        await this.metadata(source, CRM_MANAGEMENT_PERMISSION_CODES.MANAGE_CRM_ACCOUNT)
      )
    )
  }

  /** Forwards CRM identifier evidence through the exact update Code. */
  async updateCrmAccountIdentifiers(
    input: GatewayCrmRequest<UpdateCrmAccountIdentifiersRequest>,
    source: DownstreamRequestSource
  ): Promise<UpdateCrmAccountIdentifiersResponse> {
    return this.call(
      'updateCrmAccountIdentifiers',
      this.svc.updateCrmAccountIdentifiers(
        stripLocalAuthority(input),
        await this.metadata(source, CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT)
      )
    )
  }

  /** Requests manage authority only when the verified source can exercise ownerless override. */
  async convertLeadToProspectCustomer(
    input: GatewayCrmRequest<ConvertLeadToProspectCustomerRequest>,
    source: DownstreamRequestSource
  ): Promise<ConvertLeadToProspectCustomerResponse> {
    const codes: string[] = [CRM_MANAGEMENT_PERMISSION_CODES.CONVERT_CRM_ACCOUNT]
    if (sourceHasPermission(source, CRM_MANAGEMENT_PERMISSION_CODES.MANAGE_CRM_ACCOUNT)) {
      codes.push(CRM_MANAGEMENT_PERMISSION_CODES.MANAGE_CRM_ACCOUNT)
    }
    return this.call(
      'convertLeadToProspectCustomer',
      this.svc.convertLeadToProspectCustomer(
        stripLocalAuthority(input),
        await this.producer.forBusinessCall(source, CRM_TARGET_AUDIENCE, codes)
      )
    )
  }

  /** Produces exact CRM-audience metadata from the verified Gateway session. */
  private metadata(source: DownstreamRequestSource, code: string) {
    return this.producer.forBusinessCall(source, CRM_TARGET_AUDIENCE, [code])
  }

  /** Wraps one CRM command observable with the shared error contract. */
  private call<TResponse>(method: string, call$: Observable<TResponse>): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** Identifies the Gateway/CRM method pair without injecting authority. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}

/** Removes every route-local or retired CRM authority carrier before serialization. */
function stripLocalAuthority<T extends object>(input: T): T {
  const output = { ...input } as Record<string, unknown>
  for (const field of [
    'tenantId',
    'tenant_id',
    'orgId',
    'org_id',
    'operatorContext',
    'operator_context',
    'traceContext',
    'trace_context',
    'auditContext',
    'audit_context',
    'auditReason',
    'ownerAccountId',
    'owner_account_id',
    'claimForCurrentUser',
    'claim_for_current_user',
    'allowOwnerlessConversion',
    'allow_ownerless_conversion'
  ]) {
    delete output[field]
  }
  return output as T
}

/** Reads one Code only from the session facts already verified by Gateway admission. */
function sourceHasPermission(source: DownstreamRequestSource, code: string): boolean {
  return Array.isArray(source.user?.permissions) && source.user.permissions.includes(code)
}
