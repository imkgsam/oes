import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { PERMISSION_TARGET_AUDIENCE, TrustedPermissionGrpcClient } from '../../../infrastructure/grpc/trusted-permission.grpc.client'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../../infrastructure/grpc/trusted-auth.grpc.client'
import { EvaluatePolicyInstancePreviewDto } from '../interface/http/dtos/policy-instance-preview.dto'

const CALLER = 'api-gateway'
const MODE_TO_PROTO = {
  CHECK_RESOURCE: 1,
  QUERY_SCOPE: 2
} as const
const SUBJECT_SELECTOR_TO_PROTO = {
  ACCOUNT: 1,
  ROLE: 2,
  TENANT_WIDE: 3
} as const
const EFFECT_TO_PROTO = {
  ALLOW: 1,
  DENY: 2
} as const
const QUERY_SCOPE_OPERATOR_FROM_PROTO: Record<number, string> = {
  1: 'EQ',
  2: 'IN',
  3: 'INTERSECTS'
}

interface PolicyInstancePreviewGrpcClient {
  evaluatePolicyInstancePreview(request: Record<string, unknown>, ...rest: any): any
}

/** PolicyInstancePreviewGrpcAdapter bridges gateway preview requests to permission-service gRPC. */
@Injectable()
export class PolicyInstancePreviewGrpcAdapter implements OnModuleInit {
  private svc!: PolicyInstancePreviewGrpcClient

  constructor(
    private readonly client: TrustedPermissionGrpcClient,
    private readonly trusted: GatewayFoundationTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getClient().getService<PolicyInstancePreviewGrpcClient>(
      'PolicyInstancePreviewService'
    )
  }

  // Evaluates one preview-only PolicyInstance request through the downstream service.
  async evaluatePolicyInstancePreview(
    req: EvaluatePolicyInstancePreviewDto,
    source: DownstreamRequestSource
  ) {
    const result = await this.call('evaluatePolicyInstancePreview', async () =>
      this.svc.evaluatePolicyInstancePreview(
        this.toGrpcRequest(req),
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.policy.list'])
      )
    )

    return this.fromGrpcResponse(result as any)
  }

  private toGrpcRequest(req: EvaluatePolicyInstancePreviewDto) {
    return {
      mode: MODE_TO_PROTO[req.mode],
      subject: req.subject,
      permissionCode: req.permissionCode,
      resourceType: req.resourceType,
      resource: req.resource,
      policyInstances: req.policyInstances.map((policy) => ({
        ...policy,
        subjectSelector: {
          ...policy.subjectSelector,
          type: SUBJECT_SELECTOR_TO_PROTO[policy.subjectSelector.type]
        },
        effect: EFFECT_TO_PROTO[policy.effect]
      }))
    }
  }

  private fromGrpcResponse(response: any) {
    return {
      allowed: response.allowed,
      reasonCode: response.reasonCode,
      matchedPolicyIds: response.matchedPolicyIds ?? [],
      deniedPolicyIds: response.deniedPolicyIds ?? [],
      scope: this.fromGrpcScope(response.scope),
      trace: response.trace
    }
  }

  private fromGrpcScope(scope: any): any {
    if (!scope) {
      return undefined
    }

    return {
      and: scope.and?.map((item: any) => this.fromGrpcScope(item)).filter(Boolean),
      or: scope.or?.map((item: any) => this.fromGrpcScope(item)).filter(Boolean),
      field: scope.field,
      op: QUERY_SCOPE_OPERATOR_FROM_PROTO[scope.op] ?? scope.op,
      value: scope.values?.length ? scope.values : scope.value
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
