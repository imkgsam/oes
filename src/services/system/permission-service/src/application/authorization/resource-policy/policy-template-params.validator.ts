import { PolicyInstance, PolicyTemplateDefinition } from './types'

type ParamsSchema = Record<string, unknown>

/** PolicyTemplateParamsValidator enforces template-owned params schemas before preview or persistence. */
export class PolicyTemplateParamsValidator {
  /** assertValid rejects unknown or malformed params so PolicyInstance does not become free-form AST. */
  assertValid(template: PolicyTemplateDefinition, policy: Pick<PolicyInstance, 'params'>): void {
    const schema = this.resolveSchema(template)
    const params = policy.params ?? {}
    const allowedKeys = new Set(Object.keys(schema))

    for (const key of Object.keys(params)) {
      if (!allowedKeys.has(key)) {
        throw new Error(`POLICY_TEMPLATE_PARAMS_INVALID: unknown param ${key}`)
      }
    }

    for (const [key, rawRule] of Object.entries(schema)) {
      this.assertRule(key, `${rawRule}`, params[key])
    }
  }

  private resolveSchema(template: PolicyTemplateDefinition): ParamsSchema {
    return {
      ...(template.resourceFieldParamsSchema ?? {}),
      ...(template.environmentParamsSchema ?? {})
    }
  }

  private assertRule(key: string, rule: string, value: unknown): void {
    const optional = rule.endsWith('?')
    const normalizedRule = optional ? rule.slice(0, -1) : rule

    if (value === undefined || value === null || value === '') {
      if (optional) {
        return
      }
      throw new Error(`POLICY_TEMPLATE_PARAMS_INVALID: missing ${key}`)
    }

    if (normalizedRule === 'string') {
      if (typeof value !== 'string') {
        throw new Error(`POLICY_TEMPLATE_PARAMS_INVALID: ${key} must be string`)
      }
      return
    }

    if (normalizedRule === 'string[]') {
      if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || !item)) {
        throw new Error(`POLICY_TEMPLATE_PARAMS_INVALID: ${key} must be non-empty string array`)
      }
      return
    }

    if (normalizedRule === '{ days: number[], start: HH:mm, end: HH:mm }[]') {
      this.assertWorkingWindows(key, value)
      return
    }

    throw new Error(`POLICY_TEMPLATE_PARAMS_INVALID: unsupported schema for ${key}`)
  }

  private assertWorkingWindows(key: string, value: unknown): void {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error(`POLICY_TEMPLATE_PARAMS_INVALID: ${key} must be non-empty window array`)
    }

    for (const window of value) {
      if (
        !window ||
        typeof window !== 'object' ||
        !Array.isArray((window as any).days) ||
        (window as any).days.some((day: unknown) => typeof day !== 'number') ||
        typeof (window as any).start !== 'string' ||
        typeof (window as any).end !== 'string'
      ) {
        throw new Error(`POLICY_TEMPLATE_PARAMS_INVALID: ${key} contains invalid window`)
      }
    }
  }
}
