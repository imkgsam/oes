import { Inject, Injectable } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { getTraceId, injectGrpcTraceContext } from '../../tracing'
import {
  INTERNAL_SERVICE_NAME_METADATA_KEY,
  OPERATOR_CONTEXT_METADATA_KEY,
  OPERATOR_CONTEXT_SIGNER,
  REQUEST_ID_METADATA_KEY,
  TRACE_ID_METADATA_KEY
} from '../constants'
import {
  GrpcMetadataPropagationFactory,
  InternalCallMetadataInput,
  OperatorContextSigner,
  OperatorContextPayload,
  OperatorScopedMetadataInput,
  UnsignedOperatorContextPayload
} from '../types'
import { encodeOperatorContext } from '../utils'

const DEFAULT_OPERATOR_CONTEXT_TTL_MS = 5 * 60 * 1000

@Injectable()
/** This factory builds standardized internal gRPC metadata, including service identity, correlation ids, and signed operator context. */
export class DefaultGrpcMetadataPropagationFactory implements GrpcMetadataPropagationFactory {
  constructor(
    @Inject(OPERATOR_CONTEXT_SIGNER)
    private readonly signer: OperatorContextSigner
  ) {}

  createInternalCallMetadata(input: InternalCallMetadataInput): Metadata {
    const metadata = new Metadata()
    metadata.set(INTERNAL_SERVICE_NAME_METADATA_KEY, this.requireServiceName(input.callerServiceName))

    const requestId = this.normalizeOptional(input.requestId)
    const traceId = this.normalizeOptional(input.traceId) ?? getTraceId()

    if (requestId) {
      metadata.set(REQUEST_ID_METADATA_KEY, requestId)
    }

    if (traceId) {
      metadata.set(TRACE_ID_METADATA_KEY, traceId)
    }

    injectGrpcTraceContext(metadata)

    return metadata
  }

  createOperatorScopedMetadata(input: OperatorScopedMetadataInput): Metadata {
    const metadata = this.createInternalCallMetadata(input)
    metadata.set(OPERATOR_CONTEXT_METADATA_KEY, encodeOperatorContext(this.buildPayload(input)))
    return metadata
  }

  private buildPayload(input: OperatorScopedMetadataInput): OperatorContextPayload {
    const requestId = this.normalizeOptional(input.requestId) ?? this.normalizeOptional(input.operatorContext.requestId)
    const traceId =
      this.normalizeOptional(input.traceId) ??
      this.normalizeOptional(input.operatorContext.traceId) ??
      getTraceId()

    const issuedAtMs = Date.now()
    const expiresAtMs = issuedAtMs + DEFAULT_OPERATOR_CONTEXT_TTL_MS

    const unsignedPayload: UnsignedOperatorContextPayload = {
      operator_id: this.requireOperatorId(input.operatorContext.operatorId),
      operator_type: this.requireOperatorType(input.operatorContext.operatorType),
      tenant_id: this.normalizeOptional(input.operatorContext.tenantId),
      org_id: this.normalizeOptional(input.operatorContext.orgId),
      issued_at: new Date(issuedAtMs).toISOString(),
      expires_at: new Date(expiresAtMs).toISOString(),
      issuer: this.requireServiceName(input.callerServiceName),
      operator_roles: this.normalizeStringArray(input.operatorContext.operatorRoles),
      request_id: requestId,
      trace_id: traceId
    }

    return {
      ...unsignedPayload,
      signature: this.signer.sign(unsignedPayload)
    }
  }

  private requireServiceName(value: string): string {
    const normalized = value.trim()
    if (!normalized) {
      throw new Error('callerServiceName is required')
    }

    return normalized
  }

  private requireOperatorId(value: string): string {
    const normalized = value.trim()
    if (!normalized) {
      throw new Error('operatorId is required')
    }

    return normalized
  }

  private requireOperatorType(value: string): string {
    const normalized = value.trim()
    if (!normalized) {
      throw new Error('operatorType is required')
    }

    return normalized
  }

  private normalizeOptional(value?: string): string | undefined {
    const normalized = value?.trim()
    return normalized ? normalized : undefined
  }

  private normalizeStringArray(values?: string[]): string[] | undefined {
    if (!Array.isArray(values)) {
      return undefined
    }

    const normalized = values.map((value) => value.trim()).filter(Boolean)
    return normalized.length > 0 ? normalized : undefined
  }
}
