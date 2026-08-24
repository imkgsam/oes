declare const verifiedTenantTargetBrand: unique symbol

/** VerifiedTenantTarget brands an exact canonical tenant id that passed the Gateway hard boundary. */
export type VerifiedTenantTarget = string & {
  readonly [verifiedTenantTargetBrand]: true
}
