import { Metadata } from '@grpc/grpc-js'
import { AsyncLocalTrustedExecutionContextAccessor } from './trusted-execution-context'
import { TrustedGrpcMetadataProvider } from './trusted-grpc-metadata-provider'

export const PARTY_CALLER_ERRORS = Object.freeze({
  CONTEXT_REQUIRED: 'PARTY_CALLER_EXECUTION_CONTEXT_REQUIRED',
  FOUNDATION_UNAVAILABLE: 'PARTY_CALLER_FOUNDATION_UNAVAILABLE',
  SOURCE_CREDENTIAL_INVALID: 'PARTY_CALLER_SOURCE_CREDENTIAL_INVALID'
} as const)

export const ITEM_MASTER_CALLER_ERRORS = Object.freeze({
  CONTEXT_REQUIRED: 'ITEM_MASTER_CALLER_EXECUTION_CONTEXT_REQUIRED',
  FOUNDATION_UNAVAILABLE: 'ITEM_MASTER_CALLER_FOUNDATION_UNAVAILABLE',
  SOURCE_CREDENTIAL_INVALID: 'ITEM_MASTER_CALLER_SOURCE_CREDENTIAL_INVALID'
} as const)

export type InternalTrustedGrpcCallerProfile = Readonly<{
  targetAudience: string
  errors: Readonly<{
    CONTEXT_REQUIRED: string
    FOUNDATION_UNAVAILABLE: string
    SOURCE_CREDENTIAL_INVALID: string
  }>
}>

const PARTY_CALLER_PROFILE: InternalTrustedGrpcCallerProfile = Object.freeze({
  targetAudience: 'urn:oes:service:party-service',
  errors: PARTY_CALLER_ERRORS
})

export interface TrustedPartySourceProvider {
  run<T>(callback: () => Promise<T>): Promise<T>
}

/** Common execution boundary used by package-local trusted internal-call producers. */
export class InternalTrustedGrpcCaller {
  private readonly profile: InternalTrustedGrpcCallerProfile

  constructor(
    private readonly context: AsyncLocalTrustedExecutionContextAccessor,
    private readonly metadata: TrustedGrpcMetadataProvider,
    private readonly source: TrustedPartySourceProvider,
    profile: InternalTrustedGrpcCallerProfile = PARTY_CALLER_PROFILE
  ) {
    this.profile = validateProfile(profile)
  }

  async forInternalCall<T>(code: string, callback: (metadata: Metadata) => Promise<T>): Promise<T> {
    let root
    try {
      root = this.context.requireCurrent()
    } catch {
      throw new Error(this.profile.errors.CONTEXT_REQUIRED)
    }
    if (root.principalType !== 'MACHINE') {
      throw new Error(this.profile.errors.CONTEXT_REQUIRED)
    }
    try {
      return await this.source.run(() =>
        this.metadata.forInternalCall(this.profile.targetAudience, [code]).then(callback)
      )
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (Object.values(this.profile.errors).some((code) => message.includes(code.toLowerCase()))) {
        throw error
      }
      if (
        message.includes('source credential') ||
        message.includes('bearer credential') ||
        message.includes('unexpected audience') ||
        message.includes('permission codes') ||
        message.includes('invalid expiry') ||
        message.includes('executiontoken exchange') ||
        message.includes('certificate') ||
        message.includes('thumbprint') ||
        message.includes('cnf')
      ) {
        throw new Error(this.profile.errors.SOURCE_CREDENTIAL_INVALID)
      }
      if (
        message.includes('required') ||
        message.includes('configuration') ||
        message.includes('workload') ||
        message.includes('unavailable') ||
        message.includes('transport')
      ) {
        throw new Error(this.profile.errors.FOUNDATION_UNAVAILABLE)
      }
      throw new Error(this.profile.errors.FOUNDATION_UNAVAILABLE)
    }
  }
}

/** Validates DI-owned target profiles before any caller can exchange a token. */
function validateProfile(
  profile: InternalTrustedGrpcCallerProfile
): InternalTrustedGrpcCallerProfile {
  if (!/^urn:oes:service:[a-z0-9-]+$/u.test(profile.targetAudience)) {
    throw new Error('trusted internal caller targetAudience must be a service audience')
  }
  for (const value of Object.values(profile.errors)) {
    if (typeof value !== 'string' || !/^[A-Z][A-Z0-9_]+$/u.test(value)) {
      throw new Error('trusted internal caller errors must be stable literals')
    }
  }
  return Object.freeze({
    targetAudience: profile.targetAudience,
    errors: Object.freeze({ ...profile.errors })
  })
}
