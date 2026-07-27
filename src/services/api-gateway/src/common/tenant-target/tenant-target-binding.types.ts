declare const verifiedTenantTargetBrand: unique symbol

/** VerifiedTenantTarget brands a normalized tenant id that passed the gateway hard-boundary guard. */
export type VerifiedTenantTarget = string & {
  readonly [verifiedTenantTargetBrand]: true
}

/** TenantTargetSystemPolicy enumerates the currently frozen SYSTEM behavior for tenant-bound routes. */
export type TenantTargetSystemPolicy = 'DENY'

/** TenantTargetBindingMetadata declares which path parameter is bound and how SYSTEM sessions are handled. */
export interface TenantTargetBindingMetadata {
  pathParam: string
  systemPolicy: TenantTargetSystemPolicy
}

/** TenantTargetBindingOptions configures reusable tenant-target route metadata. */
export interface TenantTargetBindingOptions {
  pathParam?: string
  systemPolicy?: TenantTargetSystemPolicy
}
