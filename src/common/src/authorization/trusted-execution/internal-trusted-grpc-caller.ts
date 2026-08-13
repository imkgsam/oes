import { Metadata } from '@grpc/grpc-js'
import { AsyncLocalTrustedExecutionContextAccessor } from './trusted-execution-context'
import { TrustedGrpcMetadataProvider } from './trusted-grpc-metadata-provider'

export const PARTY_CALLER_ERRORS = Object.freeze({
  CONTEXT_REQUIRED: 'PARTY_CALLER_EXECUTION_CONTEXT_REQUIRED',
  FOUNDATION_UNAVAILABLE: 'PARTY_CALLER_FOUNDATION_UNAVAILABLE',
  SOURCE_CREDENTIAL_INVALID: 'PARTY_CALLER_SOURCE_CREDENTIAL_INVALID'
} as const)

export interface TrustedPartySourceProvider {
  run<T>(callback: () => Promise<T>): Promise<T>
}

/** Common execution boundary used by package-local Party producers. */
export class InternalTrustedGrpcCaller {
  constructor(
    private readonly context: AsyncLocalTrustedExecutionContextAccessor,
    private readonly metadata: TrustedGrpcMetadataProvider,
    private readonly source: TrustedPartySourceProvider
  ) {}

  async forInternalCall<T>(
    code: string,
    callback: (metadata: Metadata) => Promise<T>
  ): Promise<T> {
    let root
    try {
      root = this.context.requireCurrent()
    } catch {
      throw new Error(PARTY_CALLER_ERRORS.CONTEXT_REQUIRED)
    }
    if (root.principalType !== 'MACHINE') {
      throw new Error(PARTY_CALLER_ERRORS.CONTEXT_REQUIRED)
    }
    try {
      return await this.source.run(() =>
        this.metadata
          .forInternalCall('urn:oes:service:party-service', [code])
          .then(callback)
      )
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('source credential')) {
        throw new Error(PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID)
      }
      if (message.includes('required') || message.includes('configuration')) {
        throw new Error(PARTY_CALLER_ERRORS.FOUNDATION_UNAVAILABLE)
      }
      throw error
    }
  }
}
