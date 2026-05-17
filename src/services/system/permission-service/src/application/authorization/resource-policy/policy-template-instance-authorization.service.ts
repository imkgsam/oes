import { isIP } from 'node:net'
import { BuiltInPolicyTemplateRegistry } from './template-registry'
import {
  AuthorizationSubjectFacts,
  BuildQueryScopeRequest,
  BuildQueryScopeResult,
  CheckResourceRequest,
  CheckResourceResult,
  EnvironmentFacts,
  PolicyDecisionTrace,
  PolicyInstance,
  PolicyInstanceReader,
  PolicyLayer,
  QueryScopeExpression,
  ResourceFacts
} from './types'

const POLICY_LAYER_ORDER: PolicyLayer[] = ['TENANT_WIDE', 'ROLE', 'ACCOUNT']

type PolicyCriterion =
  | {
      kind: 'FIELD'
      field: string
      values: string[]
    }
  | {
      kind: 'SECURITY'
      key: string
      matched: boolean
    }

interface RelevantPolicies {
  relevant: PolicyInstance[]
  applicable: PolicyInstance[]
  skippedPolicyIds: string[]
}

/** PolicyTemplateInstanceAuthorizationService evaluates first-stage policy instances for resource checks and query scopes. */
export class PolicyTemplateInstanceAuthorizationService {
  private readonly registry = new BuiltInPolicyTemplateRegistry()

  constructor(private readonly policyInstanceReader: PolicyInstanceReader) {}

  /** checkResource evaluates enabled policy instances against caller-provided resource facts. */
  async checkResource(request: CheckResourceRequest): Promise<CheckResourceResult> {
    const policies = await this.policyInstanceReader.listEnabledPolicyInstances(request)
    const selected = this.selectRelevantPolicies(policies, request)
    const evaluatedPolicyIds = selected.relevant.map((policy) => policy.id)

    if (selected.relevant.length === 0) {
      return this.allowWithoutPolicy(evaluatedPolicyIds, selected.skippedPolicyIds)
    }

    const missingTemplate = selected.applicable.find((policy) => !this.registry.get(policy.templateCode))
    if (missingTemplate) {
      return this.deny('POLICY_TEMPLATE_NOT_FOUND', evaluatedPolicyIds, [], [], selected.skippedPolicyIds)
    }

    const denyMatches = selected.applicable.filter(
      (policy) => policy.effect === 'DENY' && this.evaluateSinglePolicy(policy, request)
    )
    if (denyMatches.length > 0) {
      return this.deny(
        'POLICY_DENY_MATCHED',
        evaluatedPolicyIds,
        [],
        denyMatches.map((policy) => policy.id),
        selected.skippedPolicyIds
      )
    }

    const allowPolicies = selected.applicable.filter((policy) => policy.effect === 'ALLOW')
    if (allowPolicies.length === 0) {
      return this.deny('POLICY_NO_ALLOW_MATCHED', evaluatedPolicyIds, [], [], selected.skippedPolicyIds)
    }

    const composite = this.evaluateAllowComposite(allowPolicies, request)
    if (!composite.allowed) {
      return this.deny(
        'POLICY_NO_ALLOW_MATCHED',
        evaluatedPolicyIds,
        composite.matchedPolicyIds,
        [],
        selected.skippedPolicyIds
      )
    }

    return {
      allowed: true,
      reasonCode: 'POLICY_ALLOW_MATCHED',
      matchedPolicyIds: composite.matchedPolicyIds,
      deniedPolicyIds: [],
      trace: this.trace(
        evaluatedPolicyIds,
        composite.matchedPolicyIds,
        [],
        selected.skippedPolicyIds,
        'POLICY_ALLOW_MATCHED'
      )
    }
  }

  /** buildQueryScope compiles applicable resource templates into a structured query scope expression. */
  async buildQueryScope(request: BuildQueryScopeRequest): Promise<BuildQueryScopeResult> {
    const policies = await this.policyInstanceReader.listEnabledPolicyInstances(request)
    const selected = this.selectRelevantPolicies(policies, request)
    const evaluatedPolicyIds = selected.relevant.map((policy) => policy.id)

    if (selected.relevant.length === 0) {
      return {
        allowed: true,
        reasonCode: 'RBAC_POLICY_BYPASS_NO_ENABLED_POLICY',
        matchedPolicyIds: [],
        deniedPolicyIds: [],
        trace: this.trace(
          evaluatedPolicyIds,
          [],
          [],
          selected.skippedPolicyIds,
          'RBAC_POLICY_BYPASS_NO_ENABLED_POLICY'
        )
      }
    }

    const missingTemplate = selected.applicable.find((policy) => !this.registry.get(policy.templateCode))
    if (missingTemplate) {
      return this.denyQueryScope(
        'POLICY_TEMPLATE_NOT_FOUND',
        evaluatedPolicyIds,
        [],
        [],
        selected.skippedPolicyIds
      )
    }

    const unsupported = selected.applicable.find((policy) => {
      const template = this.registry.get(policy.templateCode)
      return !template?.queryScopeCapable
    })
    if (unsupported) {
      return this.denyQueryScope(
        'POLICY_QUERY_SCOPE_UNSUPPORTED',
        evaluatedPolicyIds,
        [],
        [],
        selected.skippedPolicyIds
      )
    }

    const denyPolicies = selected.applicable.filter((policy) => policy.effect === 'DENY')
    if (denyPolicies.length > 0) {
      return this.denyQueryScope(
        'POLICY_DENY_QUERY_SCOPE_UNSUPPORTED',
        evaluatedPolicyIds,
        [],
        denyPolicies.map((policy) => policy.id),
        selected.skippedPolicyIds
      )
    }

    const allowPolicies = selected.applicable.filter((policy) => policy.effect === 'ALLOW')
    if (allowPolicies.length === 0) {
      return this.denyQueryScope(
        'POLICY_NO_ALLOW_MATCHED',
        evaluatedPolicyIds,
        [],
        [],
        selected.skippedPolicyIds
      )
    }

    const compiled = this.compileQueryScope(allowPolicies, request.subject)
    if (!compiled.allowed) {
      return this.denyQueryScope(
        'POLICY_QUERY_SCOPE_EMPTY',
        evaluatedPolicyIds,
        compiled.matchedPolicyIds,
        [],
        selected.skippedPolicyIds
      )
    }

    return {
      allowed: true,
      scope: compiled.scope,
      reasonCode: 'POLICY_ALLOW_MATCHED',
      matchedPolicyIds: compiled.matchedPolicyIds,
      deniedPolicyIds: [],
      trace: this.trace(
        evaluatedPolicyIds,
        compiled.matchedPolicyIds,
        [],
        selected.skippedPolicyIds,
        'POLICY_ALLOW_MATCHED'
      )
    }
  }

  /** allowWithoutPolicy preserves RBAC allow semantics when no enabled policy applies to the target. */
  private allowWithoutPolicy(
    evaluatedPolicyIds: string[],
    skippedPolicyIds: string[]
  ): CheckResourceResult {
    return {
      allowed: true,
      reasonCode: 'RBAC_POLICY_BYPASS_NO_ENABLED_POLICY',
      matchedPolicyIds: [],
      deniedPolicyIds: [],
      trace: this.trace(
        evaluatedPolicyIds,
        [],
        [],
        skippedPolicyIds,
        'RBAC_POLICY_BYPASS_NO_ENABLED_POLICY'
      )
    }
  }

  /** deny builds a checkResource denial result with an audit-oriented decision trace. */
  private deny(
    reasonCode: string,
    evaluatedPolicyIds: string[],
    matchedPolicyIds: string[],
    deniedPolicyIds: string[],
    skippedPolicyIds: string[]
  ): CheckResourceResult {
    return {
      allowed: false,
      reasonCode,
      matchedPolicyIds,
      deniedPolicyIds,
      trace: this.trace(
        evaluatedPolicyIds,
        matchedPolicyIds,
        deniedPolicyIds,
        skippedPolicyIds,
        reasonCode
      )
    }
  }

  /** denyQueryScope builds a buildQueryScope denial result without producing unsafe query text. */
  private denyQueryScope(
    reasonCode: string,
    evaluatedPolicyIds: string[],
    matchedPolicyIds: string[],
    deniedPolicyIds: string[],
    skippedPolicyIds: string[]
  ): BuildQueryScopeResult {
    return {
      allowed: false,
      reasonCode,
      matchedPolicyIds,
      deniedPolicyIds,
      trace: this.trace(
        evaluatedPolicyIds,
        matchedPolicyIds,
        deniedPolicyIds,
        skippedPolicyIds,
        reasonCode
      )
    }
  }

  /** trace captures the policy ids and final reason code used by resource authorization decisions. */
  private trace(
    evaluatedPolicyIds: string[],
    matchedAllowPolicyIds: string[],
    matchedDenyPolicyIds: string[],
    skippedPolicyIds: string[],
    reasonCode: string
  ): PolicyDecisionTrace {
    return {
      evaluatedPolicyIds,
      matchedAllowPolicyIds,
      matchedDenyPolicyIds,
      skippedPolicyIds,
      reasonCode
    }
  }

  /** selectRelevantPolicies narrows enabled policies to the request target and current subject selector. */
  private selectRelevantPolicies(
    policies: PolicyInstance[],
    request: CheckResourceRequest | BuildQueryScopeRequest
  ): RelevantPolicies {
    const subjectTenantId = request.subject.tenantId
    const resourceType = 'resource' in request ? request.resource.resourceType : request.resourceType
    const relevant = policies.filter(
      (policy) =>
        policy.enabled &&
        policy.tenantId === subjectTenantId &&
        policy.permissionCode === request.permissionCode &&
        (policy.resourceType == null || policy.resourceType === resourceType)
    )
    const applicable = relevant.filter((policy) => this.subjectMatches(policy, request.subject))
    const applicableIds = new Set(applicable.map((policy) => policy.id))

    return {
      relevant,
      applicable,
      skippedPolicyIds: relevant
        .filter((policy) => !applicableIds.has(policy.id))
        .map((policy) => policy.id)
    }
  }

  /** subjectMatches checks ACCOUNT, ROLE, and TENANT_WIDE selector applicability for the subject. */
  private subjectMatches(policy: PolicyInstance, subject: AuthorizationSubjectFacts): boolean {
    switch (policy.subjectSelector.type) {
      case 'TENANT_WIDE':
        return true
      case 'ACCOUNT':
        return policy.subjectSelector.accountId === subject.accountId
      case 'ROLE':
        return subject.roleIds.includes(policy.subjectSelector.roleId ?? '')
      default:
        return false
    }
  }

  /** evaluateSinglePolicy evaluates one policy instance as an isolated ALLOW or DENY predicate. */
  private evaluateSinglePolicy(policy: PolicyInstance, request: CheckResourceRequest): boolean {
    const criterion = this.toCriterion(policy, request.subject, request.resource, request.environment)
    if (!criterion) return false
    if (criterion.kind === 'SECURITY') return criterion.matched

    const actualValue = this.getResourceField(request.resource, criterion.field)
    return actualValue != null && criterion.values.includes(String(actualValue))
  }

  /** evaluateAllowComposite applies union-within-layer and intersection-across-layers semantics. */
  private evaluateAllowComposite(
    policies: PolicyInstance[],
    request: CheckResourceRequest
  ): { allowed: boolean; matchedPolicyIds: string[] } {
    const groups = new Map<string, { policy: PolicyInstance; matched: boolean }[]>()

    for (const policy of policies) {
      const criterion = this.toCriterion(policy, request.subject, request.resource, request.environment)
      if (!criterion) continue

      const layer = this.getPolicyLayer(policy)
      const key =
        criterion.kind === 'FIELD'
          ? `FIELD:${criterion.field}:${layer}`
          : `SECURITY:${criterion.key}:${layer}`
      const actualValue =
        criterion.kind === 'FIELD'
          ? this.getResourceField(request.resource, criterion.field)
          : undefined
      const matched =
        criterion.kind === 'FIELD'
          ? actualValue != null && criterion.values.includes(String(actualValue))
          : criterion.matched

      const group = groups.get(key) ?? []
      group.push({ policy, matched })
      groups.set(key, group)
    }

    if (groups.size === 0) return { allowed: false, matchedPolicyIds: [] }

    const matchedPolicyIds: string[] = []
    for (const group of groups.values()) {
      const matched = group.filter((entry) => entry.matched)
      if (matched.length === 0) return { allowed: false, matchedPolicyIds }
      matchedPolicyIds.push(...matched.map((entry) => entry.policy.id))
    }

    return { allowed: true, matchedPolicyIds: unique(matchedPolicyIds) }
  }

  /** compileQueryScope converts applicable ALLOW resource templates into AND-composed field scopes. */
  private compileQueryScope(
    policies: PolicyInstance[],
    subject: AuthorizationSubjectFacts
  ): { allowed: boolean; scope?: QueryScopeExpression; matchedPolicyIds: string[] } {
    const fieldLayerValues = new Map<string, Map<PolicyLayer, Set<string>>>()
    const fieldPolicyIds = new Map<string, string[]>()

    for (const policy of policies) {
      const criterion = this.toCriterion(policy, subject)
      if (!criterion || criterion.kind !== 'FIELD') continue

      const layer = this.getPolicyLayer(policy)
      const layerMap = fieldLayerValues.get(criterion.field) ?? new Map<PolicyLayer, Set<string>>()
      const values = layerMap.get(layer) ?? new Set<string>()
      criterion.values.forEach((value) => values.add(value))
      layerMap.set(layer, values)
      fieldLayerValues.set(criterion.field, layerMap)
      fieldPolicyIds.set(criterion.field, [...(fieldPolicyIds.get(criterion.field) ?? []), policy.id])
    }

    if (fieldLayerValues.size === 0) return { allowed: false, matchedPolicyIds: [] }

    const expressions: QueryScopeExpression[] = []
    const matchedPolicyIds: string[] = []

    for (const [field, layerMap] of fieldLayerValues.entries()) {
      const sortedLayerValues = POLICY_LAYER_ORDER.map((layer) => layerMap.get(layer)).filter(
        (values): values is Set<string> => values != null
      )
      const values = intersectSets(sortedLayerValues)

      if (values.length === 0) return { allowed: false, matchedPolicyIds }

      expressions.push({
        field,
        op: 'IN',
        value: values
      })
      matchedPolicyIds.push(...(fieldPolicyIds.get(field) ?? []))
    }

    const scope = expressions.length === 1 ? expressions[0] : { and: expressions }
    return {
      allowed: true,
      scope,
      matchedPolicyIds: unique(matchedPolicyIds)
    }
  }

  /** toCriterion translates a built-in policy template instance into a field or security criterion. */
  private toCriterion(
    policy: PolicyInstance,
    subject: AuthorizationSubjectFacts,
    resource?: ResourceFacts,
    environment?: EnvironmentFacts
  ): PolicyCriterion | undefined {
    switch (policy.templateCode) {
      case 'resource-field-in-set': {
        const field = readString(policy.params.field)
        const values = readStringArray(policy.params.allowedValues)
        if (!field || values.length === 0) return undefined
        return { kind: 'FIELD', field, values }
      }
      case 'resource-field-equals': {
        const field = readString(policy.params.field)
        const value = readString(policy.params.value)
        if (!field || value == null) return undefined
        return { kind: 'FIELD', field, values: [value] }
      }
      case 'resource-field-matches-subject-field': {
        const field = readString(policy.params.resourceField)
        const subjectField = readString(policy.params.subjectField)
        const values = subjectField ? toStringArray(subject[subjectField]) : []
        if (!field || values.length === 0) return undefined
        return { kind: 'FIELD', field, values }
      }
      case 'own-resource':
        return {
          kind: 'FIELD',
          field: readString(policy.params.ownerField) ?? 'ownerAccountId',
          values: [subject.accountId]
        }
      case 'org-scope':
        return {
          kind: 'FIELD',
          field: readString(policy.params.orgField) ?? 'orgId',
          values: subject.visibleOrgIds ?? []
        }
      case 'working-hours':
        return {
          kind: 'SECURITY',
          key: 'working-hours',
          matched: matchesWorkingHours(policy.params, environment)
        }
      case 'ip-allowlist':
        return {
          kind: 'SECURITY',
          key: 'ip-allowlist',
          matched: matchesIpAllowlist(policy.params, environment)
        }
      default:
        return undefined
    }
  }

  /** getPolicyLayer maps the subject selector kind to the policy composition layer. */
  private getPolicyLayer(policy: PolicyInstance): PolicyLayer {
    return policy.subjectSelector.type
  }

  /** getResourceField reads an allowlisted top-level resource fact or shallow attributes extension. */
  private getResourceField(resource: ResourceFacts, field: string): unknown {
    if (Object.prototype.hasOwnProperty.call(resource, field)) return resource[field]
    return resource.attributes?.[field]
  }
}

/** matchesWorkingHours checks a request timestamp against configured weekday time windows. */
function matchesWorkingHours(
  params: Record<string, unknown>,
  environment: EnvironmentFacts | undefined
): boolean {
  const requestTime = readString(environment?.requestTime)
  const windows = Array.isArray(params.windows) ? params.windows : []
  if (!requestTime || windows.length === 0) return false

  const date = new Date(requestTime)
  if (Number.isNaN(date.getTime())) return false

  const timezone = readString(params.timezone) ?? readString(environment?.timezone)
  const timeParts = getTimeParts(date, requestTime, timezone)
  if (!timeParts) return false

  return windows.some((window) => {
    if (!isRecord(window)) return false
    const days = readNumberArray(window.days)
    const start = readString(window.start)
    const end = readString(window.end)
    if (days.length === 0 || !start || !end) return false

    return days.includes(timeParts.isoWeekday) && timeParts.time >= start && timeParts.time <= end
  })
}

/** matchesIpAllowlist checks an environment client IP against exact IPs or IPv4 CIDR ranges. */
function matchesIpAllowlist(
  params: Record<string, unknown>,
  environment: EnvironmentFacts | undefined
): boolean {
  const clientIp = readString(environment?.clientIp)
  const cidrs = readStringArray(params.cidrs)
  if (!clientIp || cidrs.length === 0 || isIP(clientIp) === 0) return false

  return cidrs.some((cidr) => ipMatchesCidr(clientIp, cidr))
}

/** getTimeParts extracts weekday and HH:mm in the configured policy timezone. */
function getTimeParts(
  date: Date,
  rawRequestTime: string,
  timezone?: string
): { isoWeekday: number; time: string } | undefined {
  if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      }).formatToParts(date)
      const weekday = parts.find((part) => part.type === 'weekday')?.value
      const hour = parts.find((part) => part.type === 'hour')?.value
      const minute = parts.find((part) => part.type === 'minute')?.value
      if (!weekday || !hour || !minute) return undefined
      return {
        isoWeekday: weekdayToIso(weekday),
        time: `${hour}:${minute}`
      }
    } catch {
      return undefined
    }
  }

  const literalTime = rawRequestTime.match(/T(\d{2}:\d{2})/)?.[1]
  return {
    isoWeekday: date.getUTCDay() === 0 ? 7 : date.getUTCDay(),
    time: literalTime ?? `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`
  }
}

/** ipMatchesCidr checks exact IPs and IPv4 CIDR membership without shelling out. */
function ipMatchesCidr(clientIp: string, cidr: string): boolean {
  const [rangeIp, prefixText] = cidr.split('/')
  if (!rangeIp || isIP(rangeIp) === 0) return false
  if (!prefixText) return clientIp === rangeIp
  if (isIP(clientIp) !== 4 || isIP(rangeIp) !== 4) return clientIp === rangeIp

  const prefix = Number(prefixText)
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  return (ipv4ToInt(clientIp) & mask) === (ipv4ToInt(rangeIp) & mask)
}

/** ipv4ToInt converts a dotted IPv4 string to an unsigned 32-bit integer. */
function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((result, part) => (result << 8) + Number(part), 0) >>> 0
}

/** intersectSets returns the cross-layer intersection while preserving the first layer order. */
function intersectSets(sets: Set<string>[]): string[] {
  if (sets.length === 0) return []
  const [first, ...rest] = sets
  return [...first].filter((value) => rest.every((set) => set.has(value)))
}

/** readString accepts non-empty strings from untrusted policy params. */
function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** readStringArray accepts non-empty string arrays from untrusted policy params. */
function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []
}

/** readNumberArray accepts integer arrays from untrusted policy params. */
function readNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === 'number' && Number.isInteger(item))
    : []
}

/** toStringArray normalizes subject facts into string values for field matching templates. */
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter((item) => item.length > 0)
  return value == null ? [] : [String(value)]
}

/** isRecord narrows unknown values before reading structured policy params. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null
}

/** unique removes duplicate policy ids and scope values while preserving encounter order. */
function unique(values: string[]): string[] {
  return [...new Set(values)]
}

/** weekdayToIso maps Intl weekday abbreviations to the policy window weekday convention. */
function weekdayToIso(value: string): number {
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7
  }
  return map[value] ?? 0
}

/** pad2 formats time components for lexicographic HH:mm comparison. */
function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}
