import { AttributeSource } from '../enums/attribute-source.enum'
import { ConditionOperator } from '../enums/condition-operator.enum'
import { EvaluationContext } from '../services/evaluation-context'

/** Immutable value object representing a single policy condition */
export class PolicyConditionVO {
  constructor(
    public readonly id: string,
    public readonly attributeSource: AttributeSource,
    public readonly attributeKey: string,
    public readonly operator: ConditionOperator,
    public readonly rawValue: string // JSON-encoded; supports $subject.xxx dynamic refs
  ) {}

  /** Evaluate whether this condition is satisfied against the given context */
  evaluate(ctx: EvaluationContext): boolean {
    const actual = this.resolveAttribute(ctx)
    const expected = this.resolveValue(ctx)
    return this.compare(actual, expected)
  }

  // --------------- private helpers ---------------

  private resolveAttribute(ctx: EvaluationContext): any {
    const sourceMap: Record<AttributeSource, Record<string, any>> = {
      [AttributeSource.SUBJECT]: ctx.subject,
      [AttributeSource.RESOURCE]: ctx.resource,
      [AttributeSource.ENVIRONMENT]: ctx.environment,
      [AttributeSource.ACTION]: ctx.action
    }
    return sourceMap[this.attributeSource]?.[this.attributeKey]
  }

  /** Resolve value – supports $subject.xxx / $resource.xxx dynamic references */
  private resolveValue(ctx: EvaluationContext): any {
    const val = this.rawValue

    if (val.startsWith('$subject.')) return ctx.subject[val.slice(9)]
    if (val.startsWith('$resource.')) return ctx.resource[val.slice(10)]
    if (val.startsWith('$environment.')) return ctx.environment[val.slice(13)]
    if (val.startsWith('$action.')) return ctx.action[val.slice(8)]

    try {
      return JSON.parse(val)
    } catch {
      return val
    }
  }

  private compare(actual: any, expected: any): boolean {
    switch (this.operator) {
      case ConditionOperator.EQUALS:
        return actual === expected
      case ConditionOperator.NOT_EQUALS:
        return actual !== expected
      case ConditionOperator.IN:
        return Array.isArray(expected) && expected.includes(actual)
      case ConditionOperator.NOT_IN:
        return Array.isArray(expected) && !expected.includes(actual)
      case ConditionOperator.GREATER_THAN:
        return Number(actual) > Number(expected)
      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return Number(actual) >= Number(expected)
      case ConditionOperator.LESS_THAN:
        return Number(actual) < Number(expected)
      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return Number(actual) <= Number(expected)
      case ConditionOperator.BETWEEN:
        return (
          Array.isArray(expected) &&
          expected.length === 2 &&
          Number(actual) >= Number(expected[0]) &&
          Number(actual) <= Number(expected[1])
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
}
