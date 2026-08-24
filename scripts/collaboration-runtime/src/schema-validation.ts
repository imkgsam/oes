import { canonicalJson } from './canonical.ts'
import { fail } from './errors.ts'

type JsonSchema = Record<string, unknown>

/** Resolves one local JSON Pointer reference. */
function resolveReference(root: JsonSchema, reference: string): JsonSchema {
  if (!reference.startsWith('#/')) fail('JSON_SCHEMA_EXTERNAL_REF_FORBIDDEN', reference)
  let current: unknown = root
  for (const token of reference.slice(2).split('/')) {
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~')
    if (!current || typeof current !== 'object' || !(key in (current as Record<string, unknown>)))
      fail('JSON_SCHEMA_REF_NOT_FOUND', reference)
    current = (current as Record<string, unknown>)[key]
  }
  return current as JsonSchema
}

/** Returns the JSON Schema type name for one value. */
function jsonType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (Number.isInteger(value)) return 'integer'
  return typeof value === 'number' ? 'number' : typeof value
}

/** Collects deterministic validation errors for the supported draft-2020 subset. */
function collect(
  schema: JsonSchema,
  value: unknown,
  root: JsonSchema,
  path: string,
  errors: string[]
): void {
  if (typeof schema.$ref === 'string') {
    collect(resolveReference(root, schema.$ref), value, root, path, errors)
    return
  }
  if (Array.isArray(schema.allOf))
    for (const child of schema.allOf) collect(child as JsonSchema, value, root, path, errors)
  if (schema.if && typeof schema.if === 'object') {
    const conditionErrors: string[] = []
    collect(schema.if as JsonSchema, value, root, path, conditionErrors)
    if (conditionErrors.length === 0 && schema.then && typeof schema.then === 'object')
      collect(schema.then as JsonSchema, value, root, path, errors)
  }
  if ('const' in schema && canonicalJson(value) !== canonicalJson(schema.const))
    errors.push(`${path}:const`)
  if (
    Array.isArray(schema.enum) &&
    !schema.enum.some((item) => canonicalJson(item) === canonicalJson(value))
  )
    errors.push(`${path}:enum`)
  const allowedTypes = Array.isArray(schema.type)
    ? schema.type.map(String)
    : schema.type
      ? [String(schema.type)]
      : []
  if (allowedTypes.length && !allowedTypes.includes(jsonType(value))) {
    errors.push(`${path}:type=${jsonType(value)}`)
    return
  }
  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength)
      errors.push(`${path}:minLength`)
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(value))
      errors.push(`${path}:pattern`)
  }
  if (typeof value === 'number' && typeof schema.minimum === 'number' && value < schema.minimum)
    errors.push(`${path}:minimum`)
  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems)
      errors.push(`${path}:minItems`)
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems)
      errors.push(`${path}:maxItems`)
    if (schema.uniqueItems === true && new Set(value.map(canonicalJson)).size !== value.length)
      errors.push(`${path}:uniqueItems`)
    if (schema.items && typeof schema.items === 'object')
      value.forEach((item, index) =>
        collect(schema.items as JsonSchema, item, root, `${path}/${index}`, errors)
      )
    if (schema.contains && typeof schema.contains === 'object') {
      const matches = value.some((item, index) => {
        const local: string[] = []
        collect(schema.contains as JsonSchema, item, root, `${path}/${index}`, local)
        return local.length === 0
      })
      if (!matches) errors.push(`${path}:contains`)
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const object = value as Record<string, unknown>
    const required = (schema.required as string[] | undefined) ?? []
    for (const key of required) if (!(key in object)) errors.push(`${path}/${key}:required`)
    const properties = (schema.properties as Record<string, JsonSchema> | undefined) ?? {}
    if (schema.additionalProperties === false)
      for (const key of Object.keys(object))
        if (!(key in properties)) errors.push(`${path}/${key}:additionalProperties`)
    for (const [key, child] of Object.entries(properties))
      if (key in object) collect(child, object[key], root, `${path}/${key}`, errors)
  }
}

/** Validates a JSON value against the repository's executable JSON Schema subset. */
export function validateJsonSchema(schema: JsonSchema, value: unknown): void {
  const errors: string[] = []
  collect(schema, value, schema, '$', errors)
  if (errors.length) fail('JSON_SCHEMA_VALIDATION_FAILED', errors.join(';'))
}
