import type { PermissionDefinitionGroup } from '../types'

export const PROCUREMENT_MANAGEMENT_PERMISSION_CODES = {
  LIST_PURCHASE_REQUEST: 'procurement.purchase_request.list',
  GET_PURCHASE_REQUEST: 'procurement.purchase_request.get_by_id',
  CREATE_PURCHASE_REQUEST: 'procurement.purchase_request.create',
  UPDATE_PURCHASE_REQUEST_DRAFT: 'procurement.purchase_request.update_draft',
  SUBMIT_PURCHASE_REQUEST: 'procurement.purchase_request.submit',
  DECIDE_PURCHASE_REQUEST: 'procurement.purchase_request.decide',
  CANCEL_PURCHASE_REQUEST: 'procurement.purchase_request.cancel',
  CONVERT_PURCHASE_REQUEST_TO_ORDER: 'procurement.purchase_request.convert_to_order',
  LIST_PURCHASE_ORDER: 'procurement.purchase_order.list',
  GET_PURCHASE_ORDER: 'procurement.purchase_order.get_by_id',
  CREATE_PURCHASE_ORDER_DRAFT: 'procurement.purchase_order.create_draft',
  UPDATE_PURCHASE_ORDER_DRAFT: 'procurement.purchase_order.update_draft',
  ISSUE_PURCHASE_ORDER: 'procurement.purchase_order.issue',
  CONFIRM_SUPPLIER_ACKNOWLEDGEMENT: 'procurement.purchase_order.confirm_acknowledgement',
  APPLY_PURCHASE_ORDER_CHANGE: 'procurement.purchase_order.apply_change',
  CANCEL_PURCHASE_ORDER: 'procurement.purchase_order.cancel',
  LIST_PURCHASE_ORDER_CHANGES: 'procurement.purchase_order_change.list',
  LIST_RECEIVING_EXPECTATION: 'procurement.receiving_expectation.list',
  GET_RECEIVING_EXPECTATION: 'procurement.receiving_expectation.get_by_id',
  CREATE_RECEIVING_EXPECTATION: 'procurement.receiving_expectation.create',
  RECORD_RECEIVING_DISCREPANCY_RESOLUTION: 'procurement.receiving_discrepancy.record_resolution'
} as const

export const PROCUREMENT_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'procurement-service',
  permissions: {
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_REQUEST]: {
      description: '查看采购申请列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_PURCHASE_REQUEST]: {
      description: '查看采购申请详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_PURCHASE_REQUEST]: {
      description: '创建采购申请草稿',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.UPDATE_PURCHASE_REQUEST_DRAFT]: {
      description: '更新采购申请草稿',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.SUBMIT_PURCHASE_REQUEST]: {
      description: '提交采购申请',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.DECIDE_PURCHASE_REQUEST]: {
      description: '审批或驳回采购申请',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CANCEL_PURCHASE_REQUEST]: {
      description: '取消采购申请',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CONVERT_PURCHASE_REQUEST_TO_ORDER]: {
      description: '将已批准采购申请转为采购订单草稿',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_ORDER]: {
      description: '查看采购订单列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_PURCHASE_ORDER]: {
      description: '查看采购订单详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_PURCHASE_ORDER_DRAFT]: {
      description: '创建采购订单草稿',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.UPDATE_PURCHASE_ORDER_DRAFT]: {
      description: '更新采购订单草稿',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.ISSUE_PURCHASE_ORDER]: {
      description: '正式发出采购订单',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CONFIRM_SUPPLIER_ACKNOWLEDGEMENT]: {
      description: '记录供应商确认摘要',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.APPLY_PURCHASE_ORDER_CHANGE]: {
      description: '应用采购订单变更并留下留痕',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CANCEL_PURCHASE_ORDER]: {
      description: '取消采购订单',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_ORDER_CHANGES]: {
      description: '查看采购订单变更留痕',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_RECEIVING_EXPECTATION]: {
      description: '查看收货预期列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_RECEIVING_EXPECTATION]: {
      description: '查看收货预期详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_RECEIVING_EXPECTATION]: {
      description: '创建收货预期',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [PROCUREMENT_MANAGEMENT_PERMISSION_CODES.RECORD_RECEIVING_DISCREPANCY_RESOLUTION]: {
      description: '记录收货差异处理摘要',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
