import { isIP } from 'node:net'
import { ConditionOperator } from '../enums/condition-operator.enum'
import { EvaluationContext } from './evaluation-context'

export type PolicyAstSource = 'subject' | 'resource' | 'environment' | 'action'

export interface PolicyAstOperandRef {
  source: PolicyAstSource
  key: string
}

export interface PolicyAstLiteralRight {
  type: 'literal'
  value: unknown
}

export interface PolicyAstAttributeRight extends PolicyAstOperandRef {
  type: 'attribute'
}

export type PolicyAstRight = PolicyAstLiteralRight | PolicyAstAttributeRight

export interface PolicyAstComparisonNode {
  comparison: {
    left: PolicyAstOperandRef
    operator: keyof typeof ConditionOperator | ConditionOperator
    right: PolicyAstRight
  }
}

export interface PolicyAstAllNode {
  all: PolicyConditionAstNode[]
}

export interface PolicyAstAnyNode {
  any: PolicyConditionAstNode[]
}

export interface PolicyAstNotNode {
  not: PolicyConditionAstNode
}

export type PolicyConditionAstNode =
  | PolicyAstComparisonNode
  | PolicyAstAllNode
  | PolicyAstAnyNode
  | PolicyAstNotNode

export interface PolicyConditionAstValidationDetails {
  reason: string
  path?: string
  operator?: string
  source?: string
  key?: string
  expectedType?: string
  actualType?: string
  maxDepth?: number
  maxNodes?: number
}

export class PolicyConditionAstValidationError extends Error {
  constructor(public readonly details: PolicyConditionAstValidationDetails) {
    super(details.reason)
  }
}

const ALLOWED_KEYS: Record<PolicyAstSource, Set<string>> = {
  subject: new Set(['account_id', 'tenant_id', 'role_codes', 'department_id', 'is_system_admin']),
  resource: new Set([
    'resource_id',
    'resource_type',
    'tenant_id',
    'owner_id',
    'department_id',
    'created_by'
  ]),
  environment: new Set(['current_datetime', 'current_date', 'current_time', 'weekday', 'client_ip']),
  action: new Set(['name'])
}

const ALLOWED_OPERATORS = new Set<ConditionOperator>([
  ConditionOperator.EQUALS,
  ConditionOperator.NOT_EQUALS,
  ConditionOperator.IN,
  ConditionOperator.NOT_IN,
  ConditionOperator.GREATER_THAN,
  ConditionOperator.GREATER_THAN_OR_EQUAL,
  ConditionOperator.LESS_THAN,
  ConditionOperator.LESS_THAN_OR_EQUAL,
  ConditionOperator.BETWEEN,
  ConditionOperator.IS_NULL,
  ConditionOperator.IS_NOT_NULL
])

const MAX_AST_DEPTH = 8
const MAX_AST_NODES = 64

type PolicyAstValueKind =
  | 'string'
  | 'string_array'
  | 'boolean'
  | 'datetime'
  | 'date'
  | 'time'
  | 'weekday'
  | 'ip'

const KEY_VALUE_KIND: Record<PolicyAstSource, Record<string, PolicyAstValueKind>> = {
  subject: {
    account_id: 'string',
    tenant_id: 'string',
    role_codes: 'string_array',
    department_id: 'string',
    is_system_admin: 'boolean'
  },
  resource: {
    resource_id: 'string',
    resource_type: 'string',
    tenant_id: 'string',
    owner_id: 'string',
    department_id: 'string',
    created_by: 'string'
  },
  environment: {
    current_datetime: 'datetime',
    current_date: 'date',
    current_time: 'time',
    weekday: 'weekday',
    client_ip: 'ip'
  },
  action: {
    name: 'string'
  }
}

export function parsePolicyConditionAstJson(raw: string): PolicyConditionAstNode {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new PolicyConditionAstValidationError({
      reason: 'invalid_condition_ast_json'
    })
  }

  if (!isAstNode(parsed)) {
    throw new PolicyConditionAstValidationError({
      reason: 'invalid_ast_root'
    })
  }

  validatePolicyConditionAst(parsed)
  return parsed
}

export function evaluatePolicyConditionAst(
  node: PolicyConditionAstNode,
  ctx: EvaluationContext
): boolean {
  if ('all' in node) return node.all.every((child) => evaluatePolicyConditionAst(child, ctx))
  if ('any' in node) return node.any.some((child) => evaluatePolicyConditionAst(child, ctx))
  if ('not' in node) return !evaluatePolicyConditionAst(node.not, ctx)
  return evaluateComparison(node.comparison, ctx)
}

function evaluateComparison(
  comparison: PolicyAstComparisonNode['comparison'],
  ctx: EvaluationContext
): boolean {
  if (!isAllowedOperand(comparison.left)) return false
  if (comparison.right.type === 'attribute' && !isAllowedOperand(comparison.right)) return false

  const actual = resolveOperand(ctx, comparison.left)
  const expected =
    comparison.right.type === 'attribute'
      ? resolveOperand(ctx, comparison.right)
      : comparison.right.value

  return compare(
    normalizeValue(comparison.left.key, actual),
    comparison.operator as ConditionOperator,
    normalizeRightValue(comparison.left.key, expected)
  )
}

function resolveOperand(ctx: EvaluationContext, operand: PolicyAstOperandRef): unknown {
  switch (operand.source) {
    case 'subject':
      return ctx.subject[operand.key]
    case 'resource':
      return ctx.resource[operand.key]
    case 'environment':
      return ctx.environment[operand.key]
    case 'action':
      return ctx.action[operand.key]
  }
}

function normalizeRightValue(key: string, value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => normalizeValue(key, item))
  return normalizeValue(key, value)
}

function normalizeValue(key: string, value: unknown): unknown {
  if (value == null) return value

  switch (key) {
    case 'current_time':
      return typeof value === 'string' ? parseTime(value) : value
    case 'current_date':
      return typeof value === 'string' ? Date.parse(`${value}T00:00:00Z`) : value
    case 'current_datetime':
      return typeof value === 'string' ? Date.parse(value) : value
    case 'is_system_admin':
      if (typeof value === 'string') return value === 'true'
      return Boolean(value)
    default:
      return value
  }
}

function compare(actual: unknown, operator: ConditionOperator, expected: unknown): boolean {
  switch (operator) {
    case ConditionOperator.EQUALS:
      return actual === expected
    case ConditionOperator.NOT_EQUALS:
      return actual !== expected
    case ConditionOperator.IN:
      return Array.isArray(expected) && expected.some((item) => matchExpected(actual, item))
    case ConditionOperator.NOT_IN:
      return Array.isArray(expected) && expected.every((item) => !matchExpected(actual, item))
    case ConditionOperator.GREATER_THAN:
      return toComparable(actual) > toComparable(expected)
    case ConditionOperator.GREATER_THAN_OR_EQUAL:
      return toComparable(actual) >= toComparable(expected)
    case ConditionOperator.LESS_THAN:
      return toComparable(actual) < toComparable(expected)
    case ConditionOperator.LESS_THAN_OR_EQUAL:
      return toComparable(actual) <= toComparable(expected)
    case ConditionOperator.BETWEEN:
      return (
        Array.isArray(expected) &&
        expected.length === 2 &&
        toComparable(actual) >= toComparable(expected[0]) &&
        toComparable(actual) < toComparable(expected[1])
      )
    case ConditionOperator.CONTAINS:
      return typeof actual === 'string' && actual.includes(String(expected))
    case ConditionOperator.STARTS_WITH:
      return typeof actual === 'string' && actual.startsWith(String(expected))
    case ConditionOperator.REGEX:
      return new RegExp(String(expected)).test(String(actual))
    case ConditionOperator.IS_NULL:
      return actual == null
    case ConditionOperator.IS_NOT_NULL:
      return actual != null
    default:
      return false
  }
}

function matchExpected(actual: unknown, expected: unknown): boolean {
  if (typeof actual === 'string' && typeof expected === 'string' && expected.includes('/')) {
    return isIpInCidr(actual, expected)
  }
  return actual === expected
}

function toComparable(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string') {
    const numeric = Number(value)
    return Number.isNaN(numeric) ? Date.parse(value) : numeric
  }
  return Number.NaN
}

function parseTime(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return Number.NaN
  return Number(match[1]) * 60 + Number(match[2])
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [network, bits] = cidr.split('/')
  const prefix = Number(bits)
  const parsedIp = parseIpAddress(ip)
  const parsedNetwork = parseIpAddress(network)

  if (
    parsedIp == null ||
    parsedNetwork == null ||
    parsedIp.family !== parsedNetwork.family ||
    Number.isNaN(prefix)
  ) {
    return false
  }

  if (parsedIp.family === 4) {
    if (prefix < 0 || prefix > 32) return false
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
    return (((parsedIp.value as number) & mask) >>> 0) === (((parsedNetwork.value as number) & mask) >>> 0)
  }

  if (prefix < 0 || prefix > 128) return false
  const fullMask = (1n << 128n) - 1n
  const mask = prefix === 0 ? 0n : ((fullMask << BigInt(128 - prefix)) & fullMask)
  return ((parsedIp.value as bigint) & mask) === ((parsedNetwork.value as bigint) & mask)
}

function ipv4ToInt(value: string): number | null {
  const segments = value.split('.')
  if (segments.length !== 4) return null

  const nums = segments.map((segment) => Number(segment))
  if (nums.some((segment) => Number.isNaN(segment) || segment < 0 || segment > 255)) return null

  return (
    ((nums[0] << 24) >>> 0) +
    ((nums[1] << 16) >>> 0) +
    ((nums[2] << 8) >>> 0) +
    (nums[3] >>> 0)
  ) >>> 0
}

function ipv6ToBigInt(value: string): bigint | null {
  const normalized = expandIpv6(value)
  if (normalized == null) return null

  return normalized.reduce((result, hextet) => (result << 16n) + BigInt(parseInt(hextet, 16)), 0n)
}

function expandIpv6(value: string): string[] | null {
  const sanitized = value.trim().toLowerCase()
  if (sanitized.length === 0 || isIP(sanitized) !== 6) return null
  if (sanitized.includes('.')) return null

  const parts = sanitized.split('::')
  if (parts.length > 2) return null

  const left = parts[0] ? parts[0].split(':').filter(Boolean) : []
  const right = parts.length === 2 && parts[1] ? parts[1].split(':').filter(Boolean) : []

  if (left.some((part) => !isIpv6Hextet(part)) || right.some((part) => !isIpv6Hextet(part))) return null

  if (parts.length === 1) {
    if (left.length !== 8) return null
    return left
  }

  const missing = 8 - (left.length + right.length)
  if (missing < 1) return null

  return [...left, ...Array.from({ length: missing }, () => '0'), ...right]
}

function isIpv6Hextet(value: string): boolean {
  return /^[0-9a-f]{1,4}$/i.test(value)
}

function parseIpAddress(value: string): { family: 4 | 6; value: number | bigint } | null {
  const family = isIP(value)
  if (family === 4) {
    const numeric = ipv4ToInt(value)
    return numeric == null ? null : { family: 4, value: numeric }
  }

  if (family === 6) {
    const numeric = ipv6ToBigInt(value)
    return numeric == null ? null : { family: 6, value: numeric }
  }

  return null
}

function isAllowedOperand(operand: PolicyAstOperandRef): boolean {
  return ALLOWED_KEYS[operand.source]?.has(operand.key) ?? false
}

export function validatePolicyConditionAst(node: PolicyConditionAstNode): void {
  const counter = { count: 0 }
  validateNode(node, '$', 1, counter)
}

function validateNode(
  node: PolicyConditionAstNode,
  path: string,
  depth: number,
  counter: { count: number }
): void {
  counter.count += 1
  if (counter.count > MAX_AST_NODES) {
    throw new PolicyConditionAstValidationError({
      reason: 'ast_node_limit_exceeded',
      path,
      maxNodes: MAX_AST_NODES
    })
  }

  if (depth > MAX_AST_DEPTH) {
    throw new PolicyConditionAstValidationError({
      reason: 'ast_depth_limit_exceeded',
      path,
      maxDepth: MAX_AST_DEPTH
    })
  }

  if ('all' in node) {
    if (node.all.length === 0) {
      throw new PolicyConditionAstValidationError({
        reason: 'empty_all_node',
        path
      })
    }

    node.all.forEach((child, index) => validateNode(child, `${path}.all[${index}]`, depth + 1, counter))
    return
  }

  if ('any' in node) {
    if (node.any.length === 0) {
      throw new PolicyConditionAstValidationError({
        reason: 'empty_any_node',
        path
      })
    }

    node.any.forEach((child, index) => validateNode(child, `${path}.any[${index}]`, depth + 1, counter))
    return
  }

  if ('not' in node) {
    validateNode(node.not, `${path}.not`, depth + 1, counter)
    return
  }

  validateComparisonNode(node.comparison, `${path}.comparison`)
}

function validateComparisonNode(
  comparison: PolicyAstComparisonNode['comparison'],
  path: string
): void {
  validateOperandRef(comparison.left, `${path}.left`)

  const operator = normalizeOperator(comparison.operator)
  if (!ALLOWED_OPERATORS.has(operator)) {
    throw new PolicyConditionAstValidationError({
      reason: 'unsupported_operator',
      path: `${path}.operator`,
      operator: String(comparison.operator)
    })
  }

  const leftKind = getOperandKind(comparison.left)
  const rightKind = validateRightOperand(comparison.right, `${path}.right`)

  validateOperatorCompatibility(operator, leftKind, rightKind, comparison.right, path)
}

function validateOperandRef(operand: PolicyAstOperandRef, path: string): void {
  if (!isAllowedOperand(operand)) {
    throw new PolicyConditionAstValidationError({
      reason: 'unsupported_attribute_key',
      path,
      source: operand.source,
      key: operand.key
    })
  }
}

function validateRightOperand(
  right: PolicyAstRight,
  path: string
): PolicyAstValueKind {
  if (right.type === 'attribute') {
    validateOperandRef(right, path)
    return getOperandKind(right)
  }

  return inferLiteralKind(right.value, path)
}

function getOperandKind(operand: PolicyAstOperandRef): PolicyAstValueKind {
  return KEY_VALUE_KIND[operand.source][operand.key]
}

function inferLiteralKind(value: unknown, path: string): PolicyAstValueKind {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new PolicyConditionAstValidationError({
        reason: 'empty_literal_array',
        path
      })
    }

    if (value.every((item) => typeof item === 'string')) return 'string_array'
  }

  if (typeof value === 'boolean') return 'boolean'
  if (typeof value !== 'string') {
    throw new PolicyConditionAstValidationError({
      reason: 'unsupported_literal_type',
      path,
      actualType: Array.isArray(value) ? 'array' : typeof value
    })
  }

  if (/^\d{2}:\d{2}$/.test(value)) return 'time'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
  if (!Number.isNaN(Date.parse(value)) && value.includes('T')) return 'datetime'
  if (
    ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].includes(value)
  ) {
    return 'weekday'
  }
  if (isIpLiteral(value)) return 'ip'

  return 'string'
}

function validateOperatorCompatibility(
  operator: ConditionOperator,
  leftKind: PolicyAstValueKind,
  rightKind: PolicyAstValueKind,
  right: PolicyAstRight,
  path: string
): void {
  if (operator === ConditionOperator.IS_NULL || operator === ConditionOperator.IS_NOT_NULL) return

  if (operator === ConditionOperator.BETWEEN) {
    if (right.type !== 'literal' || !Array.isArray(right.value) || right.value.length !== 2) {
      throw new PolicyConditionAstValidationError({
        reason: 'between_requires_two_literal_values',
        path: `${path}.right`
      })
    }

    const itemKinds = right.value.map((item, index) => inferLiteralKind(item, `${path}.right.value[${index}]`))
    if (!itemKinds.every((kind) => kind === leftKind)) {
      throw new PolicyConditionAstValidationError({
        reason: 'between_value_type_mismatch',
        path: `${path}.right`,
        expectedType: leftKind,
        actualType: itemKinds.join(',')
      })
    }

    if (!isComparableKind(leftKind)) {
      throw new PolicyConditionAstValidationError({
        reason: 'between_operator_not_supported_for_type',
        path: `${path}.operator`,
        operator,
        expectedType: 'comparable',
        actualType: leftKind
      })
    }

    return
  }

  if (operator === ConditionOperator.IN || operator === ConditionOperator.NOT_IN) {
    if (right.type === 'attribute') {
      if (rightKind !== `${leftKind}_array`) {
        throw new PolicyConditionAstValidationError({
          reason: 'attribute_membership_type_mismatch',
          path: `${path}.right`,
          expectedType: `${leftKind}_array`,
          actualType: rightKind
        })
      }
      return
    }

    if (rightKind !== 'string_array') {
      throw new PolicyConditionAstValidationError({
        reason: 'membership_requires_array_literal',
        path: `${path}.right`,
        expectedType: 'array',
        actualType: rightKind
      })
    }

    if (leftKind !== 'string' && leftKind !== 'weekday' && leftKind !== 'ip') {
      throw new PolicyConditionAstValidationError({
        reason: 'membership_operator_not_supported_for_type',
        path: `${path}.operator`,
        operator,
        actualType: leftKind
      })
    }
    return
  }

  if (
    operator === ConditionOperator.GREATER_THAN ||
    operator === ConditionOperator.GREATER_THAN_OR_EQUAL ||
    operator === ConditionOperator.LESS_THAN ||
    operator === ConditionOperator.LESS_THAN_OR_EQUAL
  ) {
    if (!isComparableKind(leftKind) || !isComparableKind(rightKind) || leftKind !== rightKind) {
      throw new PolicyConditionAstValidationError({
        reason: 'comparison_type_mismatch',
        path: `${path}.right`,
        operator,
        expectedType: leftKind,
        actualType: rightKind
      })
    }

    return
  }

  if (leftKind !== rightKind) {
    throw new PolicyConditionAstValidationError({
      reason: 'comparison_type_mismatch',
      path: `${path}.right`,
      operator,
      expectedType: leftKind,
      actualType: rightKind
    })
  }
}

function normalizeOperator(operator: keyof typeof ConditionOperator | ConditionOperator): ConditionOperator {
  return operator as ConditionOperator
}

function isComparableKind(kind: PolicyAstValueKind): boolean {
  return kind === 'time' || kind === 'date' || kind === 'datetime'
}

function isIpLiteral(value: string): boolean {
  if (parseIpAddress(value) != null) return true
  if (!value.includes('/')) return false

  const [network, bits] = value.split('/')
  const prefix = Number(bits)
  const parsedNetwork = parseIpAddress(network)
  if (parsedNetwork == null || Number.isNaN(prefix)) return false

  return (
    value.split('/').length === 2 &&
    prefix >= 0 &&
    prefix <= (parsedNetwork.family === 4 ? 32 : 128)
  )
}

function isAstNode(value: unknown): value is PolicyConditionAstNode {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const keys = Object.keys(value)
  if (keys.length !== 1) return false

  if ('all' in value) return Array.isArray(value.all) && value.all.every((child) => isAstNode(child))
  if ('any' in value) return Array.isArray(value.any) && value.any.every((child) => isAstNode(child))
  if ('not' in value) return isAstNode(value.not)
  if ('comparison' in value) {
    const comparison = value.comparison
    if (!comparison || typeof comparison !== 'object' || Array.isArray(comparison)) return false
    return (
      isOperandRef((comparison as Record<string, unknown>).left) &&
      typeof (comparison as Record<string, unknown>).operator === 'string' &&
      isRightOperand((comparison as Record<string, unknown>).right)
    )
  }

  return false
}

function isOperandRef(value: unknown): value is PolicyAstOperandRef {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.source === 'string' &&
    ['subject', 'resource', 'environment', 'action'].includes(record.source) &&
    typeof record.key === 'string' &&
    record.key.length > 0
  )
}

function isRightOperand(value: unknown): value is PolicyAstRight {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  if (record.type === 'literal') return 'value' in record
  if (record.type === 'attribute') return isOperandRef(value)
  return false
}
