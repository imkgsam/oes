export type HumanGrantSnapshot = {
  readonly active: boolean
  readonly permissionCodes: readonly string[]
  readonly authzVersion: string
}

/** Resolves Permission-owned current HUMAN grants without accepting them from Auth request fields. */
export interface DelegatedHumanGrantResolver {
  resolve(input: {
    readonly humanPrincipalId: string
    readonly tenantId: string
    readonly orgId?: string
    readonly requestedPermissionCodes: readonly string[]
  }): Promise<HumanGrantSnapshot>
}

/** Evaluates current resource-policy facts after all fixed delegation and ToolContract bounds match. */
export interface DelegatedResourcePolicyEvaluator {
  evaluate(input: {
    readonly humanPrincipalId: string
    readonly tenantId: string
    readonly orgId?: string
    readonly targetAudience: string
    readonly operationKey: string
    readonly resourceFacts: Readonly<Record<string, unknown>>
  }): Promise<{
    readonly allowed: boolean
    readonly decisionReference: string
    readonly stepUpRequired: boolean
  }>
}
