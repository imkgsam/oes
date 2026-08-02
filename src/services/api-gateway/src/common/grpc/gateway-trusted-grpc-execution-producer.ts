import { Metadata } from '@grpc/grpc-js'
import { isSpanContextValid, trace } from '@opentelemetry/api'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  createTrustedExecutionContext,
  TrustedExecutionContext,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import {
  DownstreamRequestSource,
  GatewayAuthenticatedUser
} from './gateway-downstream-source.mapper'

/** Carries W3C correlation resolved from the trusted Gateway tracing boundary. */
export type GatewayTrustedTraceContext = {
  readonly traceparent: string
  readonly tracestate?: string
}

/** Resolves trace propagation without treating a legacy x-trace-id as W3C span authority. */
export interface GatewayTrustedTraceContextProvider {
  getTraceContext(): GatewayTrustedTraceContext | undefined
}

/** Reads the active OpenTelemetry server span established by Gateway instrumentation. */
export class ActiveOtelGatewayTraceContextProvider implements GatewayTrustedTraceContextProvider {
  /** Serializes the active valid span into canonical W3C propagation fields. */
  getTraceContext(): GatewayTrustedTraceContext | undefined {
    const spanContext = trace.getActiveSpan()?.spanContext()
    if (spanContext === undefined || !isSpanContextValid(spanContext)) {
      return undefined
    }
    const traceparent = `00-${spanContext.traceId}-${spanContext.spanId}-${spanContext.traceFlags
      .toString(16)
      .padStart(2, '0')}`
    const tracestate = spanContext.traceState?.serialize()
    return Object.freeze({ traceparent, ...(tracestate ? { tracestate } : {}) })
  }
}

/** Wires verified Gateway session roots into Common's single target-bound gRPC metadata provider. */
export class GatewayTrustedGrpcExecutionProducer {
  constructor(
    private readonly contextAccessor: AsyncLocalTrustedExecutionContextAccessor,
    private readonly metadataProvider: TrustedGrpcMetadataProvider,
    private readonly traceContextProvider: GatewayTrustedTraceContextProvider = new ActiveOtelGatewayTraceContextProvider()
  ) {}

  /** Produces one BUSINESS call metadata set from session truth and method-owned target authority. */
  async forBusinessCall(
    source: DownstreamRequestSource,
    targetAudience: string,
    requiredPermissionCodes: readonly string[]
  ): Promise<Metadata> {
    return this.contextAccessor.run(this.createSessionContext(source), () =>
      this.metadataProvider.forBusinessCall(targetAudience, requiredPermissionCodes)
    )
  }

  /** Produces one SELF_SERVICE call metadata set from the same verified session root. */
  async forSelfServiceCall(
    source: DownstreamRequestSource,
    targetAudience: string
  ): Promise<Metadata> {
    return this.contextAccessor.run(this.createSessionContext(source), () =>
      this.metadataProvider.forSelfServiceCall(targetAudience)
    )
  }

  /** Produces one INTERNAL primitive call while preserving the verified upstream execution attribution. */
  async forInternalCall(
    source: DownstreamRequestSource,
    targetAudience: string,
    requiredInternalPermissionCodes: readonly string[]
  ): Promise<Metadata> {
    return this.contextAccessor.run(this.createSessionContext(source), () =>
      this.metadataProvider.forInternalCall(targetAudience, requiredInternalPermissionCodes)
    )
  }

  /** Converts only post-session-validation Gateway facts into an immutable HUMAN execution root. */
  private createSessionContext(source: DownstreamRequestSource): TrustedExecutionContext {
    const user = requireVerifiedSession(source.user)
    const activeTrace = this.traceContextProvider.getTraceContext()
    return createTrustedExecutionContext({
      subject: firstExactValue(user.holderId, user.aid, user.id, user.sub),
      principalType: 'HUMAN',
      ...optionalValue(user.tenantId ?? user.tid, 'tenantId'),
      ...optionalValue(user.orgId, 'orgId'),
      sessionId: requireExactValue(user.sid, 'verified Gateway session id'),
      ...optionalAuthzVersion(user.authzVersion),
      requestId: requireExactValue(source.requestId, 'verified Gateway request id'),
      traceparent: requireExactValue(
        source.traceparent ?? activeTrace?.traceparent,
        'verified Gateway traceparent'
      ),
      ...optionalValue(source.tracestate ?? activeTrace?.tracestate, 'tracestate')
    })
  }
}

/** Requires the session-auth guard's user facts before any downstream producer is reached. */
function requireVerifiedSession(
  user: GatewayAuthenticatedUser | undefined
): GatewayAuthenticatedUser {
  if (user === undefined) {
    throw new Error('Verified Gateway session facts are required')
  }
  return user
}

/** Selects the canonical account principal established by Gateway session validation. */
function firstExactValue(...values: Array<string | undefined>): string {
  const selected = values.find((value) => typeof value === 'string' && value.length > 0)
  return requireExactValue(selected, 'verified Gateway execution subject')
}

/** Requires one exact verified fact without trimming caller-controlled ambiguity into validity. */
function requireExactValue(value: string | undefined, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) {
    throw new Error(`${label} is required`)
  }
  return value
}

/** Copies one optional exact verified fact without inventing a fallback value. */
function optionalValue(value: string | undefined, propertyName: string): Record<string, string> {
  return value === undefined ? {} : { [propertyName]: requireExactValue(value, propertyName) }
}

/** Copies an opaque session authorization version only when Gateway validation supplied one. */
function optionalAuthzVersion(value: string | number | undefined): {
  readonly authzVersion?: string | number
} {
  return value === undefined ? {} : { authzVersion: value }
}
