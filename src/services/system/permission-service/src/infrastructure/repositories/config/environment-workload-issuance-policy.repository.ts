import { Injectable } from '@nestjs/common'
import {
  AuthorizationScopeLevel,
  WorkloadIssuancePolicyFacts
} from '../../../domain/authorization/permission-decision.types'
import { WorkloadIssuancePolicyRepository } from '../../../domain/repositories/workload-issuance-policy.repository'

const AUDIENCE_PATTERN = /^urn:oes:service:[a-z0-9][a-z0-9-]*$/

/** Resolves immutable workload issuance policies from one deployment-owned JSON configuration. */
@Injectable()
export class EnvironmentWorkloadIssuancePolicyRepository implements WorkloadIssuancePolicyRepository {
  private policies?: readonly WorkloadIssuancePolicyFacts[]

  constructor(
    private readonly rawPolicies: string | undefined = process.env
      .PERMISSION_WORKLOAD_ISSUANCE_POLICIES
  ) {}

  /** Returns only an exact workload, audience, scope and optional tenant policy match. */
  async findPolicy(input: Parameters<WorkloadIssuancePolicyRepository['findPolicy']>[0]) {
    const matches = this.getPolicies().filter(
      (policy) =>
        policy.originalWorkloadSpiffeId === input.originalWorkloadSpiffeId &&
        policy.targetAudience === input.targetAudience &&
        policy.scopeLevel === input.scopeLevel &&
        (input.scopeLevel === 'SYSTEM' || policy.tenantIds?.includes(input.tenantId!) === true)
    )
    if (matches.length > 1) {
      throw new Error('PERMISSION_WORKLOAD_ISSUANCE_POLICIES contains an ambiguous policy tuple')
    }
    return matches[0] ?? null
  }

  /** Parses and freezes configuration once so requests never mutate deployment authority. */
  private getPolicies(): readonly WorkloadIssuancePolicyFacts[] {
    if (this.policies) return this.policies
    this.policies = parsePolicies(this.rawPolicies)
    return this.policies
  }
}

/** Parses only canonical exact workload policy entries and rejects wildcard or partial authority. */
function parsePolicies(raw: string | undefined): readonly WorkloadIssuancePolicyFacts[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '')
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('empty policies')
    const policies = parsed.map(parsePolicy)
    const identities = new Set(
      policies.map((policy) =>
        [
          policy.originalWorkloadSpiffeId,
          policy.targetAudience,
          policy.scopeLevel,
          ...(policy.tenantIds ?? []),
          policy.policyVersion
        ].join('|')
      )
    )
    if (identities.size !== policies.length) throw new Error('duplicate policy')
    return Object.freeze(policies)
  } catch {
    throw new Error('PERMISSION_WORKLOAD_ISSUANCE_POLICIES must contain canonical exact policies')
  }
}

/** Validates and freezes one deployment policy without coercing caller-controlled values. */
function parsePolicy(value: unknown): WorkloadIssuancePolicyFacts {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid policy')
  const input = value as Record<string, unknown>
  const originalWorkloadSpiffeId = exactString(input.originalWorkloadSpiffeId)
  const targetAudience = exactString(input.targetAudience)
  const permissionCodes = canonicalStrings(input.permissionCodes)
  const scopeLevel = input.scopeLevel as AuthorizationScopeLevel
  const policyVersion = exactString(input.policyVersion)
  if (
    !originalWorkloadSpiffeId.startsWith('spiffe://') ||
    originalWorkloadSpiffeId.includes('*') ||
    !AUDIENCE_PATTERN.test(targetAudience) ||
    permissionCodes.some((code) => !code.includes('.internal.')) ||
    (scopeLevel !== 'SYSTEM' && scopeLevel !== 'TENANT')
  ) {
    throw new Error('invalid policy')
  }
  const tenantIds = input.tenantIds === undefined ? undefined : canonicalStrings(input.tenantIds)
  if (
    (scopeLevel === 'TENANT' && (!tenantIds || tenantIds.length === 0)) ||
    (scopeLevel === 'SYSTEM' && tenantIds !== undefined)
  ) {
    throw new Error('invalid scope policy')
  }
  return Object.freeze({
    originalWorkloadSpiffeId,
    targetAudience,
    permissionCodes: Object.freeze(permissionCodes) as unknown as string[],
    scopeLevel,
    ...(tenantIds ? { tenantIds: Object.freeze(tenantIds) as unknown as string[] } : {}),
    policyVersion
  })
}

/** Requires an exact non-empty string without trimming it into authority. */
function exactString(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) {
    throw new Error('invalid exact string')
  }
  return value
}

/** Requires non-empty unique and already-sorted exact string arrays. */
function canonicalStrings(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error('invalid array')
  const strings = value.map(exactString)
  const canonical = [...new Set(strings)].sort()
  if (
    canonical.length !== strings.length ||
    canonical.some((item, index) => item !== strings[index])
  ) {
    throw new Error('non-canonical array')
  }
  return canonical
}
