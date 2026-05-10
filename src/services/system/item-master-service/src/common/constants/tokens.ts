/** TOKENS centralizes injectable repository and port tokens for item-master-service. */
export const TOKENS = {
  ITEM_MASTER_AUDIT_WRITER: Symbol('ITEM_MASTER_AUDIT_WRITER'),
  ITEM_MASTER_TRANSACTION_RUNNER: Symbol('ITEM_MASTER_TRANSACTION_RUNNER')
} as const
