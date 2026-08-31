export type HumanOboSubjectScope =
  | Readonly<{ subjectScope: 'SYSTEM'; optionalTenantId?: never }>
  | Readonly<{ subjectScope: 'TENANT'; optionalTenantId: string }>

/** Enforces the single scope/tenant truth table shared by HUMAN OBO verification and signing. */
export function requireHumanOboSubjectScope(
  subjectScope: unknown,
  optionalTenantId: unknown
): HumanOboSubjectScope {
  if (subjectScope === 'SYSTEM' && optionalTenantId === undefined) {
    return Object.freeze({ subjectScope: 'SYSTEM' })
  }
  if (
    subjectScope === 'TENANT' &&
    typeof optionalTenantId === 'string' &&
    optionalTenantId.length > 0 &&
    optionalTenantId.trim() === optionalTenantId &&
    optionalTenantId !== '*'
  ) {
    return Object.freeze({ subjectScope: 'TENANT', optionalTenantId })
  }
  throw new Error('HUMAN OBO subject scope and tenant are inconsistent')
}
