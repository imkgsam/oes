import type { PermissionDefinitionGroup } from '../types'

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
  ALLOCATE_PAYMENT_TO_RECEIVABLE: 'finance.payment_allocation.allocate_to_receivable',
  READ_PAYABLE: 'finance.payable.read',
  CREATE_PAYABLE_FROM_PURCHASE_ORDER: 'finance.payable.create_from_purchase_order',
  ADJUST_PAYABLE_FROM_PURCHASE_ORDER_CHANGE: 'finance.payable.adjust_from_purchase_order_change',
  CREATE_PAYMENT_REQUEST: 'finance.payment_request.create',
  DECIDE_PAYMENT_REQUEST: 'finance.payment_request.decide',
  CREATE_PAYMENT_EXECUTION: 'finance.payment_execution.create',
  CREATE_PAYMENT_ALLOCATION: 'finance.payment_allocation.create'
} as const

export const FINANCE_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'finance-service',
  permissions: {
    [FINANCE_MANAGEMENT_PERMISSION_CODES.LIST_FINANCIAL_ACCOUNT]: {
      description: '查看资金账户列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.GET_FINANCIAL_ACCOUNT]: {
      description: '查看资金账户详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_FINANCIAL_ACCOUNT]: {
      description: '创建资金账户',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.UPDATE_FINANCIAL_ACCOUNT_BASICS]: {
      description: '更新资金账户基础信息',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.LIST_ACCOUNT_TRANSACTION]: {
      description: '查看账户流水列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.IMPORT_ACCOUNT_TRANSACTION]: {
      description: '批量导入账户流水',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.RECORD_ACCOUNT_TRANSACTION]: {
      description: '手工登记账户流水',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.REGISTER_CUSTOMER_FINANCIAL_ACCOUNT]: {
      description: '登记客户付款账号',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.GET_EXCHANGE_RATE]: {
      description: '查看标准汇率',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.SET_EXCHANGE_RATE]: {
      description: '设置标准汇率',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.LIST_RECEIVABLE_SCHEDULE]: {
      description: '查看应收计划列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.GET_RECEIVABLE_SCHEDULE]: {
      description: '查看应收计划详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_RECEIVABLE_SCHEDULE_FROM_SALES_ORDER]: {
      description: '从销售订单建立应收计划',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.GET_FINANCE_RELEASE_SIGNAL]: {
      description: '查看财务放行信号',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.SET_FINANCE_RELEASE_SIGNAL]: {
      description: '设置财务放行信号',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.LIST_PAYMENT_ALLOCATION]: {
      description: '查看收款核销结果',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.ALLOCATE_PAYMENT_TO_RECEIVABLE]: {
      description: '将收款流水核销到应收计划',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.READ_PAYABLE]: {
      description: '查看应付计划、付款申请、付款执行与付款核销摘要',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_PAYABLE_FROM_PURCHASE_ORDER]: {
      description: '从采购订单建立应付计划',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.ADJUST_PAYABLE_FROM_PURCHASE_ORDER_CHANGE]: {
      description: '根据采购订单变更调整应付计划',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_PAYMENT_REQUEST]: {
      description: '创建付款申请',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.DECIDE_PAYMENT_REQUEST]: {
      description: '审批或驳回付款申请',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_PAYMENT_EXECUTION]: {
      description: '记录付款执行动作',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_PAYMENT_ALLOCATION]: {
      description: '将付款流水核销到应付计划',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
