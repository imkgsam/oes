/** TOKENS centralizes mes-service dependency injection keys without leaking business semantics into common. */
export const TOKENS = {
  MES_MOLD_REPOSITORY: Symbol('MES_MOLD_REPOSITORY')
} as const
