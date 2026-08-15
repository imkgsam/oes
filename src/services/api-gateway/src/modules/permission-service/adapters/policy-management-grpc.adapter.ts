import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GetPolicyByIdRequest,
  ListPoliciesByPermissionRequest,
  ListPoliciesResponse,
  ListPoliciesPagedRequest,
  POLICY_MANAGEMENT_SERVICE_NAME,
  PagedPoliciesResponse,
  PolicyManagementServiceClient,
  PolicyResponse
} from '@oes/common/generated/permission_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { PERMISSION_TARGET_AUDIENCE, TrustedPermissionGrpcClient } from '../../../infrastructure/grpc/trusted-permission.grpc.client'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../../infrastructure/grpc/trusted-auth.grpc.client'

const CALLER = 'api-gateway'

type ListPoliciesRequest = ListPoliciesPagedRequest & {
  hasIsEnabledFilter?: boolean
}

// Bridges gateway readonly policy governance requests onto the downstream policy gRPC contract.
@Injectable()
export class PolicyManagementGrpcAdapter implements OnModuleInit {
  private svc!: PolicyManagementServiceClient

  constructor(
    private readonly client: TrustedPermissionGrpcClient,
    private readonly trusted: GatewayFoundationTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getClient().getService<PolicyManagementServiceClient>(
      POLICY_MANAGEMENT_SERVICE_NAME
    )
  }

  // Reads paged policy governance rows while preserving downstream pagination metadata.
  async listPolicies(
    req: ListPoliciesRequest,
    source: DownstreamRequestSource
  ): Promise<PagedPoliciesResponse> {
    const payload: ListPoliciesPagedRequest = {
      keyword: req.keyword || undefined,
      page: req.page || 1,
      pageSize: req.pageSize || 20,
      permissionCode: req.permissionCode || undefined,
      tenantId: req.tenantId || undefined
    }

    if (req.hasIsEnabledFilter) {
      payload.isEnabled = req.isEnabled
    }

    if (Object.prototype.hasOwnProperty.call(req, 'subjectType')) {
      payload.subjectType = req.subjectType
    }

    if (Object.prototype.hasOwnProperty.call(req, 'subjectId')) {
      payload.subjectId = req.subjectId
    }

    return this.call('listPoliciesPaged', async () =>
      this.svc.listPoliciesPaged(
        payload,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.policy.list'])
      )
    )
  }

  // Reads one policy governance row by stable id.
  async getPolicyById(
    req: GetPolicyByIdRequest,
    source: DownstreamRequestSource
  ): Promise<PolicyResponse> {
    return this.call('getPolicyById', async () =>
      this.svc.getPolicyById(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.policy.list'])
      )
    )
  }

  // Reads policy governance rows linked to one permission code.
  async listPoliciesByPermission(
    req: ListPoliciesByPermissionRequest,
    source: DownstreamRequestSource
  ): Promise<ListPoliciesResponse> {
    return this.call('listPoliciesByPermission', async () =>
      this.svc.listPoliciesByPermission(
        {
          permissionCode: req.permissionCode,
          tenantId: req.tenantId || undefined
        },
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.policy.list'])
      )
    )
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

    if (normalized.includes('operator context is invalid')) {
      return new HttpException(
        {
          code: 'APP_SECURITY_004',
          message: 'Operator context is invalid'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    if (normalized.includes('operator context is missing')) {
      return new HttpException(
        {
          code: 'APP_SECURITY_003',
          message: 'Operator context is missing'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    if (normalized.includes('internal service metadata is missing')) {
      return new HttpException(
        {
          code: 'APP_SECURITY_001',
          message: 'Internal service metadata is missing'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    if (normalized.includes('internal service signature is invalid')) {
      return new HttpException(
        {
          code: 'APP_SECURITY_002',
          message: 'Internal service signature is invalid'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    return error
  }
}
