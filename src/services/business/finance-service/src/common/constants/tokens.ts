/** TOKENS centralizes injectable repository and infrastructure tokens for finance-service phase 1A. */
export const TOKENS = {
  FINANCE_REPOSITORY: Symbol('FINANCE_REPOSITORY'),
  FINANCE_AUDIT_WRITER: Symbol('FINANCE_AUDIT_WRITER'),
  FINANCE_TRANSACTION_RUNNER: Symbol('FINANCE_TRANSACTION_RUNNER')
} as const
