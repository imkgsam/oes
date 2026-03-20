import { PolicyEffect } from '../enums/policy-effect.enum'
import { PolicySubjectType } from '../enums/policy-subject-type.enum'

/** ABAC Policy aggregate root */
export class Policy {
  constructor(
    public readonly id: string,
    public name: string,
    public effect: PolicyEffect,
    public priority: number,
    public subjectType: PolicySubjectType,
    public subjectId: string | null,
    public permissionCode: string,
    public resourceType: string | null,
    public tenantId: string | null,
    public isEnabled: boolean,
    public conditionAstJson: string | null = null,
    public description?: string
  ) {}

  disable(): void {
    this.isEnabled = false
  }

  enable(): void {
    this.isEnabled = true
  }
}
