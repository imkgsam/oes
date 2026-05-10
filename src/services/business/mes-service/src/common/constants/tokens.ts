/** TOKENS centralizes mes-service dependency injection keys without leaking business semantics into common. */
export const TOKENS = {
  MES_MOLD_REPOSITORY: Symbol('MES_MOLD_REPOSITORY'),
  PRODUCTION_SPEC_REPOSITORY: Symbol('PRODUCTION_SPEC_REPOSITORY'),
  MANUFACTURABLE_ITEM_LOOKUP_PORT: Symbol('MANUFACTURABLE_ITEM_LOOKUP_PORT')
} as const
