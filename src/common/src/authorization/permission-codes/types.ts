export type PermissionKind = 'BUSINESS' | 'INTERNAL'
export type PermissionAssignee = 'HUMAN' | 'MACHINE' | 'WORKLOAD_POLICY'
export type PermissionScopeLevel = 'SYSTEM' | 'TENANT'

/** PermissionDefinition is one bounded-context-owned static semantic record. */
export interface PermissionDefinition {
  readonly description: string
  readonly kind: PermissionKind
  readonly assignableTo: readonly PermissionAssignee[]
  readonly allowedScopeLevels: readonly PermissionScopeLevel[]
  readonly externalApiEligible?: boolean
}

/** PermissionDefinitionGroup preserves semantic ownership beside each bounded-context code source. */
export interface PermissionDefinitionGroup {
  readonly ownerService: string
  readonly permissions: Readonly<Record<string, PermissionDefinition>>
}

/** EffectivePermissionDefinition is the flattened read-only lookup record consumed at runtime. */
export interface EffectivePermissionDefinition extends PermissionDefinition {
  readonly code: string
  readonly ownerService: string
}
