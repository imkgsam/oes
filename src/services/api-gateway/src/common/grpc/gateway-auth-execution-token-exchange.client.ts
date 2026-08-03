import { Metadata } from '@grpc/grpc-js'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  ExecutionTokenExchangeClient,
  ExecutionTokenExchangeRequest,
  ExecutionTokenExchangeResult,
  REQUEST_ID_METADATA_KEY,
  TRACE_ID_METADATA_KEY,
  TRACEPARENT_METADATA_KEY,
  TRACESTATE_METADATA_KEY
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  EXECUTION_TOKEN_SERVICE_NAME,
  ExecutionTokenServiceClient
} from '@oes/common/generated/auth_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'

/** Exchanges exact target declarations through Auth STS over mTLS without legacy identity metadata. */
@Injectable()
export class GatewayAuthExecutionTokenExchangeClient
  implements ExecutionTokenExchangeClient, OnModuleInit
{
  private service?: ExecutionTokenServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.AUTH)
    private readonly client: ClientGrpc | (() => ClientGrpc),
    private readonly contextAccessor: AsyncLocalTrustedExecutionContextAccessor
  ) {}

  /** Binds the generated Auth STS client after the shared gRPC transport is ready. */
  onModuleInit(): void {}

  /** Sends only the frozen exchange request plus request/trace correlation from trusted context. */
  async exchange(request: ExecutionTokenExchangeRequest): Promise<ExecutionTokenExchangeResult> {
    const response = await safeGrpcCall(
      this.executionTokenService().exchangeExecutionToken(
        {
          targetAudience: request.targetAudience,
          requestedPermissionCodes: [...request.requestedPermissionCodes]
        },
        this.correlationMetadata()
      ),
      {
        caller: 'api-gateway',
        method: 'ExecutionTokenService.exchangeExecutionToken'
      }
    )

    return Object.freeze({
      accessToken: response.accessToken,
      tokenType: response.tokenType,
      expiresAtUnixSeconds: Number.parseInt(response.expiresAtUnixSeconds, 10),
      expiresInSeconds: Number.parseInt(response.expiresInSeconds, 10),
      kid: response.kid,
      grantedPermissionCodes: Object.freeze([...(response.grantedPermissionCodes ?? [])]),
      grantedAudience: response.grantedAudience
    })
  }

  /** Resolves the dedicated mTLS channel only when one migrated Asset call needs an exchange. */
  private executionTokenService(): ExecutionTokenServiceClient {
    if (this.service === undefined) {
      const client = typeof this.client === 'function' ? this.client() : this.client
      this.service = client.getService<ExecutionTokenServiceClient>(EXECUTION_TOKEN_SERVICE_NAME)
    }
    return this.service
  }

  /** Creates correlation-only metadata and excludes every legacy operator/service authority header. */
  private correlationMetadata(): Metadata {
    const context = this.contextAccessor.requireCurrent()
    const metadata = new Metadata()
    metadata.set(REQUEST_ID_METADATA_KEY, context.requestId)
    metadata.set(TRACEPARENT_METADATA_KEY, context.traceparent)
    metadata.set(TRACE_ID_METADATA_KEY, context.traceparent.slice(3, 35))
    if (context.tracestate !== undefined) metadata.set(TRACESTATE_METADATA_KEY, context.tracestate)
    return metadata
  }
}
