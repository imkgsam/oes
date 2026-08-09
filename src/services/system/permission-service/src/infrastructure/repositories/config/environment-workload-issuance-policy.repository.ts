import { Injectable } from '@nestjs/common'
import {
  AuthorizationScopeLevel,
  WorkloadIssuancePolicyFacts
} from '../../../domain/authorization/permission-decision.types'
import { WorkloadIssuancePolicyRepository } from '../../../domain/repositories/workload-issuance-policy.repository'

const AUDIENCE_PATTERN = /^urn:oes:service:[a-z0-9][a-z0-9-]*$/
const POLICY_FIELDS = new Set([
  'originalWorkloadSpiffeId',
  'targetAudience',
  'permissionCodes',
  'scopeLevel',
  'tenantIds',
  'policyVersion'
])

/** Resolves immutable workload issuance policies from one deployment-owned JSON configuration. */
@Injectable()
export class EnvironmentWorkloadIssuancePolicyRepository implements WorkloadIssuancePolicyRepository {
  private readonly policies: readonly WorkloadIssuancePolicyFacts[]

  constructor(rawPolicies = process.env.PERMISSION_WORKLOAD_ISSUANCE_POLICIES) {
    this.policies = parsePolicies(rawPolicies)
  }

  /** Returns only an exact workload, audience, scope and optional tenant policy match. */
  async findPolicy(input: Parameters<WorkloadIssuancePolicyRepository['findPolicy']>[0]) {
    const matches = this.policies.filter(
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
}

/** Parses only canonical exact workload policy entries and rejects wildcard or partial authority. */
function parsePolicies(raw: string | undefined): readonly WorkloadIssuancePolicyFacts[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '')
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('empty policies')
    const policies = parsed.map(parsePolicy)
    assertUnambiguousPolicyTuples(policies)
    return Object.freeze(policies)
  } catch {
    throw new Error('PERMISSION_WORKLOAD_ISSUANCE_POLICIES must contain canonical exact policies')
  }
}

/** Validates and freezes one deployment policy without coercing caller-controlled values. */
function parsePolicy(value: unknown): WorkloadIssuancePolicyFacts {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid policy')
  const input = value as Record<string, unknown>
  if (Object.keys(input).some((field) => !POLICY_FIELDS.has(field))) {
    throw new Error('unsupported policy field')
  }
  const originalWorkloadSpiffeId = exactString(input.originalWorkloadSpiffeId)
  const targetAudience = exactString(input.targetAudience)
  const permissionCodes = canonicalStrings(input.permissionCodes)
  const scopeLevel = input.scopeLevel as AuthorizationScopeLevel
  const policyVersion = exactString(input.policyVersion)
  if (
    !isExactSpiffeId(originalWorkloadSpiffeId) ||
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

/** Rejects policies whose expanded workload/audience/scope/tenant tuples overlap. */
function assertUnambiguousPolicyTuples(policies: readonly WorkloadIssuancePolicyFacts[]): void {
  const tuples = new Set<string>()
  for (const policy of policies) {
    const tenantIds = policy.scopeLevel === 'SYSTEM' ? [''] : (policy.tenantIds ?? [])
    for (const tenantId of tenantIds) {
      const tuple = JSON.stringify([
        policy.originalWorkloadSpiffeId,
        policy.targetAudience,
        policy.scopeLevel,
        tenantId
      ])
      if (tuples.has(tuple)) throw new Error('ambiguous policy tuple')
      tuples.add(tuple)
    }
  }
}

/** Accepts only canonical SPIFFE URI values with a trust domain and workload path. */
function isExactSpiffeId(value: string): boolean {
  try {
    const parsed = new URL(value)
    return (
      parsed.protocol === 'spiffe:' &&
      parsed.hostname.length > 0 &&
      parsed.pathname.length > 1 &&
      parsed.username === '' &&
      parsed.password === '' &&
      parsed.search === '' &&
      parsed.hash === '' &&
      !value.includes('*') &&
      parsed.toString() === value
    )
  } catch {
    return false
  }
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
