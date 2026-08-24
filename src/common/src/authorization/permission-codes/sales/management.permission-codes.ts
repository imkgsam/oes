import type { PermissionDefinitionGroup } from '../types'

export const SALES_MANAGEMENT_PERMISSION_CODES = {
  LIST_QUOTE: 'sales.quote.list',
  GET_QUOTE: 'sales.quote.get_by_id',
  CREATE_QUOTE: 'sales.quote.create',
  UPDATE_QUOTE_DRAFT: 'sales.quote.update_draft',
  PUBLISH_QUOTE: 'sales.quote.publish',
  CONVERT_QUOTE_TO_ORDER: 'sales.quote.convert_to_order',
  LIST_ORDER: 'sales.order.list',
  VIEW_ORDER_DETAIL: 'sales.order.get_by_id',
  SET_ORDER_COMMERCIAL_GATE: 'sales.order.set_commercial_gate',
  SUBMIT_FULFILLMENT_HANDOFF: 'sales.order.submit_fulfillment_handoff'
} as const

export const SALES_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'sales-service',
  permissions: {
    [SALES_MANAGEMENT_PERMISSION_CODES.LIST_QUOTE]: {
      description: '查看报价列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SALES_MANAGEMENT_PERMISSION_CODES.GET_QUOTE]: {
      description: '查看报价详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SALES_MANAGEMENT_PERMISSION_CODES.CREATE_QUOTE]: {
      description: '创建报价草稿',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SALES_MANAGEMENT_PERMISSION_CODES.UPDATE_QUOTE_DRAFT]: {
      description: '更新报价草稿',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SALES_MANAGEMENT_PERMISSION_CODES.PUBLISH_QUOTE]: {
      description: '正式发布报价版本',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SALES_MANAGEMENT_PERMISSION_CODES.CONVERT_QUOTE_TO_ORDER]: {
      description: '将正式报价版本转为销售订单',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SALES_MANAGEMENT_PERMISSION_CODES.LIST_ORDER]: {
      description: '查看销售订单列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SALES_MANAGEMENT_PERMISSION_CODES.VIEW_ORDER_DETAIL]: {
      description: '查看销售订单详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SALES_MANAGEMENT_PERMISSION_CODES.SET_ORDER_COMMERCIAL_GATE]: {
      description: '设置销售订单商业放行结果',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SALES_MANAGEMENT_PERMISSION_CODES.SUBMIT_FULFILLMENT_HANDOFF]: {
      description: '提交销售订单到履约边界的 handoff',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
