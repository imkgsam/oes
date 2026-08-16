import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  CheckLeadDuplicateRequest,
  CheckLeadDuplicateResponse,
  CustomerQueryServiceClient,
  GetCrmAccountRequest,
  GetCrmAccountResponse,
  ListCrmAccountsRequest,
  ListCrmAccountsResponse,
  ListSourceRecordsRequest,
  ListSourceRecordsResponse
} from '@oes/common/generated/crm_service'
import { CRM_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { Observable } from 'rxjs'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  CRM_TARGET_AUDIENCE,
  GatewayCrmGrpcClient
} from '../../../common/grpc/gateway-crm-grpc.client'
import { GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc/gateway-trusted-grpc-execution-producer'

const CALLER = 'api-gateway'
type GatewayCrmRequest<T> = T & Record<string, unknown>

/** Proxies CRM queries through one dedicated mTLS channel and exact BUSINESS tokens. */
@Injectable()
export class CustomerQueryGrpcAdapter implements OnModuleInit {
  private svc!: CustomerQueryServiceClient

  constructor(
    private readonly client: GatewayCrmGrpcClient,
    private readonly producer: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.customerQuery()
  }

  /** Forwards one CRM P1 account workspace query without body authority. */
  async listCrmAccounts(
    input: GatewayCrmRequest<ListCrmAccountsRequest>,
    source: DownstreamRequestSource
  ): Promise<ListCrmAccountsResponse> {
    return this.call(
      'listCrmAccounts',
      this.svc.listCrmAccounts(stripLocalAuthority(input), await this.metadata(source))
    )
  }

  /** Forwards one CRM P1 account detail query without body authority. */
  async getCrmAccount(
    input: GatewayCrmRequest<GetCrmAccountRequest>,
    source: DownstreamRequestSource
  ): Promise<GetCrmAccountResponse> {
    return this.call(
      'getCrmAccount',
      this.svc.getCrmAccount(stripLocalAuthority(input), await this.metadata(source))
    )
  }

  /** Forwards one CRM account source evidence query without body authority. */
  async listSourceRecords(
    input: GatewayCrmRequest<ListSourceRecordsRequest>,
    source: DownstreamRequestSource
  ): Promise<ListSourceRecordsResponse> {
    return this.call(
      'listSourceRecords',
      this.svc.listSourceRecords(stripLocalAuthority(input), await this.metadata(source))
    )
  }

  /** Forwards one CRM duplicate evidence query without body authority. */
  async checkLeadDuplicate(
    input: GatewayCrmRequest<CheckLeadDuplicateRequest>,
    source: DownstreamRequestSource
  ): Promise<CheckLeadDuplicateResponse> {
    return this.call(
      'checkLeadDuplicate',
      this.svc.checkLeadDuplicate(stripLocalAuthority(input), await this.metadata(source))
    )
  }

  /** Produces exact CRM-audience metadata from the verified Gateway session. */
  private metadata(source: DownstreamRequestSource) {
    return this.producer.forBusinessCall(source, CRM_TARGET_AUDIENCE, [
      CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT
    ])
  }

  /** Wraps one CRM query observable with the shared error contract. */
  private call<TResponse>(method: string, call$: Observable<TResponse>): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** Identifies the Gateway/CRM method pair without injecting authority. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}

/** Removes route-local and retired authority fields before protobuf serialization. */
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
    'claimForCurrentUser',
    'claim_for_current_user',
    'allowOwnerlessConversion',
    'allow_ownerless_conversion'
  ]) {
    delete output[field]
  }
  return output as T
}
