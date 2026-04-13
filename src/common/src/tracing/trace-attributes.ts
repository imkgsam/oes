export const TRACE_ATTRIBUTE_KEYS = {
  tenantId: 'tenant.id',
  orgId: 'org.id',
  resourceType: 'resource.type',
  resourceId: 'resource.id',
  service: 'service.name',
  module: 'oes.module',
  operation: 'oes.operation'
} as const

type TraceAttributeValue = string | number | boolean

const ALLOWED_TRACE_ATTRIBUTES = new Set<string>(Object.values(TRACE_ATTRIBUTE_KEYS))

export function filterAllowedTraceAttributes(
  attributes: Record<string, unknown>
): Record<string, TraceAttributeValue> {
  return Object.fromEntries(
    Object.entries(attributes).filter(
      ([key, value]) => ALLOWED_TRACE_ATTRIBUTES.has(key) && isTraceAttributeValue(value)
    )
  ) as Record<string, TraceAttributeValue>
}

function isTraceAttributeValue(value: unknown): value is TraceAttributeValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
