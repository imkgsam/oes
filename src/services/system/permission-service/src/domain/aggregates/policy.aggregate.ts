import { PolicyEffect } from '../enums/policy-effect.enum'
import { PolicySubjectType } from '../enums/policy-subject-type.enum'
import { PolicyConditionVO } from '../vo/policy-condition.value-object'

/** ABAC Policy aggregate root */
export class Policy {
  constructor(
    public readonly id: string,
    public name: string,
    public effect: PolicyEffect,
    public priority: number,
    public subjectType: PolicySubjectType,
    public subjectId: string | null,
    public permissionCode: string | null,
    public resourceType: string | null,
    public tenantId: string | null,
    public isEnabled: boolean,
    private _conditions: PolicyConditionVO[] = [],
    public description?: string
  ) {}

  get conditions(): ReadonlyArray<PolicyConditionVO> {
    return [...this._conditions]
  }

  addCondition(condition: PolicyConditionVO): void {
    this._conditions.push(condition)
  }

  removeCondition(conditionId: string): void {
    this._conditions = this._conditions.filter((c) => c.id !== conditionId)
  }

  replaceConditions(conditions: PolicyConditionVO[]): void {
    this._conditions = [...conditions]
  }

  disable(): void {
    this.isEnabled = false
  }

  enable(): void {
    this.isEnabled = true
  }
}
