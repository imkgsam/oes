import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  PERMISSION_TARGET_AUDIENCE,
  TrustedPermissionGrpcClient
} from '../../../infrastructure/grpc/trusted-permission.grpc.client'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../../infrastructure/grpc/trusted-auth.grpc.client'

const CALLER = 'api-gateway'
const POLICY_INSTANCE_MANAGEMENT_SERVICE_NAME = 'PolicyInstanceManagementService'

const SUBJECT_SELECTOR_FROM_PROTO: Record<number, string> = {
  1: 'ACCOUNT',
  2: 'ROLE',
  3: 'TENANT_WIDE'
}

const SUBJECT_SELECTOR_TO_PROTO: Record<string, number> = {
  ACCOUNT: 1,
  ROLE: 2,
  TENANT_WIDE: 3
}

const EFFECT_FROM_PROTO: Record<number, string> = {
  1: 'ALLOW',
  2: 'DENY'
}

const EFFECT_TO_PROTO: Record<string, number> = {
  ALLOW: 1,
  DENY: 2
}

export interface ListPolicyInstancesRequest {
  page?: number
  pageSize?: number
  tenantId?: string
  permissionCode?: string
  resourceType?: string
  templateCode?: string
  subjectSelectorType?: 'ACCOUNT' | 'ROLE' | 'TENANT_WIDE'
  subjectSelectorValue?: string
  hasEnabledFilter?: boolean
  enabled?: boolean
}

export interface GetPolicyInstanceRequest {
  id: string
}

export interface CreatePolicyInstanceRequest {
  tenantId: string
  subjectSelector: {
    type: 'ACCOUNT' | 'ROLE' | 'TENANT_WIDE'
    accountId?: string
    roleId?: string
  }
  permissionCode: string
  resourceType?: string
  templateCode: string
  effect: 'ALLOW' | 'DENY'
  params: Record<string, unknown>
  enabled?: boolean
  priority?: number
}

export interface SetPolicyInstanceEnabledRequest {
  id: string
  enabled: boolean
}

interface PolicyInstanceManagementGrpcClient {
  createPolicyInstance(request: Record<string, unknown>, ...rest: any): any
  getPolicyInstance(request: Record<string, unknown>, ...rest: any): any
  listPolicyInstances(request: Record<string, unknown>, ...rest: any): any
  setPolicyInstanceEnabled(request: Record<string, unknown>, ...rest: any): any
}

/** PolicyInstanceManagementGrpcAdapter bridges readonly PolicyInstance governance requests to permission-service. */
@Injectable()
export class PolicyInstanceManagementGrpcAdapter implements OnModuleInit {
  private svc!: PolicyInstanceManagementGrpcClient

  constructor(
    private readonly client: TrustedPermissionGrpcClient,
    private readonly trusted: GatewayFoundationTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client
      .getClient()
      .getService<PolicyInstanceManagementGrpcClient>(POLICY_INSTANCE_MANAGEMENT_SERVICE_NAME)
  }

  /** listPolicyInstances reads paged PolicyInstance governance records. */
  async listPolicyInstances(req: ListPolicyInstancesRequest, source: DownstreamRequestSource) {
    const payload: Record<string, unknown> = {
      page: req.page || 1,
      pageSize: req.pageSize || 20,
      tenantId: req.tenantId || undefined,
      permissionCode: req.permissionCode || undefined,
      resourceType: req.resourceType || undefined,
      templateCode: req.templateCode || undefined,
      subjectSelectorType: req.subjectSelectorType
        ? SUBJECT_SELECTOR_TO_PROTO[req.subjectSelectorType]
        : undefined,
      subjectSelectorValue: req.subjectSelectorValue || undefined,
      hasEnabledFilter: req.hasEnabledFilter ?? false
    }

    if (req.hasEnabledFilter) {
      payload.enabled = req.enabled
    }

    const result = await this.call<any>('listPolicyInstances', async () =>
      this.svc.listPolicyInstances(
        payload,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, [
          'permission.policy.list'
        ])
      )
    )

    return {
      policyInstances: (result.policyInstances ?? []).map((record: any) =>
        this.fromGrpcRecord(record)
      ),
      total: result.total ?? 0,
      page: result.page ?? payload.page,
      pageSize: result.pageSize ?? payload.pageSize
    }
  }

  /** createPolicyInstance writes one template-based PolicyInstance through permission-service. */
  async createPolicyInstance(req: CreatePolicyInstanceRequest, source: DownstreamRequestSource) {
    const result = await this.call<any>('createPolicyInstance', async () =>
      this.svc.createPolicyInstance(
        {
          tenantId: req.tenantId,
          subjectSelector: this.toGrpcSubjectSelector(req.subjectSelector),
          permissionCode: req.permissionCode,
          resourceType: req.resourceType || undefined,
          templateCode: req.templateCode,
          effect: EFFECT_TO_PROTO[req.effect],
          params: req.params,
          enabled: req.enabled ?? true,
          priority: req.priority ?? 0
        },
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, [
          'permission.policy.create'
        ])
      )
    )

    return this.fromGrpcRecord(result)
  }

  /** getPolicyInstanceById reads one PolicyInstance governance record by stable id. */
  async getPolicyInstanceById(req: GetPolicyInstanceRequest, source: DownstreamRequestSource) {
    const result = await this.call<any>('getPolicyInstance', async () =>
      this.svc.getPolicyInstance(
        { id: req.id },
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, [
          'permission.policy.list'
        ])
      )
    )

    return this.fromGrpcRecord(result)
  }

  /** setPolicyInstanceEnabled enables or disables one persisted PolicyInstance fact. */
  async setPolicyInstanceEnabled(
    req: SetPolicyInstanceEnabledRequest,
    source: DownstreamRequestSource
  ) {
    const result = await this.call<any>('setPolicyInstanceEnabled', async () =>
      this.svc.setPolicyInstanceEnabled(
        {
          id: req.id,
          enabled: req.enabled
        },
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, [
          'permission.policy.update'
        ])
      )
    )

    return this.fromGrpcRecord(result)
  }

  private fromGrpcRecord(record: any) {
    return {
      ...record,
      subjectSelector: this.fromGrpcSubjectSelector(record?.subjectSelector),
      effect: EFFECT_FROM_PROTO[record?.effect] ?? record?.effect
    }
  }

  private toGrpcSubjectSelector(selector: CreatePolicyInstanceRequest['subjectSelector']) {
    return {
      type: SUBJECT_SELECTOR_TO_PROTO[selector.type],
      accountId: selector.accountId || undefined,
      roleId: selector.roleId || undefined
    }
  }

  private fromGrpcSubjectSelector(selector: any) {
    if (!selector) {
      return undefined
    }

    return {
      ...selector,
      type: SUBJECT_SELECTOR_FROM_PROTO[selector.type] ?? selector.type
    }
  }

  private async call<T>(method: string, factory: () => any): Promise<T> {
    try {
      const result = await safeGrpcCall(await factory(), this.opts(method))
      return result as T
    } catch (error) {
      throw this.mapDownstreamError(error)
    }
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }

  private mapDownstreamError(error: unknown): unknown {
    if (!(error instanceof Error)) {
      return error
    }

    const message = error.message || 'Downstream service error'
    const normalized = message.toLowerCase()

    if (normalized.includes('authorization denied')) {
      return new HttpException(
        {
          code: 'AUTHORIZATION_DENIED',
          message: 'Authorization denied'
        },
        HttpStatus.FORBIDDEN
      )
    }

    return error
  }
}
