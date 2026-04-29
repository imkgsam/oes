export const FINANCE_MANAGEMENT_PERMISSION_CODES = {
  LIST_FINANCIAL_ACCOUNT: 'finance.financial_account.list',
  GET_FINANCIAL_ACCOUNT: 'finance.financial_account.get_by_id',
  CREATE_FINANCIAL_ACCOUNT: 'finance.financial_account.create',
  UPDATE_FINANCIAL_ACCOUNT_BASICS: 'finance.financial_account.update_basics',
  LIST_ACCOUNT_TRANSACTION: 'finance.account_transaction.list',
  IMPORT_ACCOUNT_TRANSACTION: 'finance.account_transaction.import',
  RECORD_ACCOUNT_TRANSACTION: 'finance.account_transaction.record',
  REGISTER_CUSTOMER_FINANCIAL_ACCOUNT: 'finance.customer_financial_account.register',
  GET_EXCHANGE_RATE: 'finance.exchange_rate.get',
  SET_EXCHANGE_RATE: 'finance.exchange_rate.set',
  LIST_RECEIVABLE_SCHEDULE: 'finance.receivable_schedule.list',
  GET_RECEIVABLE_SCHEDULE: 'finance.receivable_schedule.get_by_id',
  CREATE_RECEIVABLE_SCHEDULE_FROM_SALES_ORDER:
    'finance.receivable_schedule.create_from_sales_order',
  GET_FINANCE_RELEASE_SIGNAL: 'finance.finance_release_signal.get',
  SET_FINANCE_RELEASE_SIGNAL: 'finance.finance_release_signal.set',
  LIST_PAYMENT_ALLOCATION: 'finance.payment_allocation.list',
  ALLOCATE_PAYMENT_TO_RECEIVABLE: 'finance.payment_allocation.allocate_to_receivable'
} as const
