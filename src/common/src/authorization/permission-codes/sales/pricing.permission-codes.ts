import type { PermissionDefinitionGroup } from '../types'

export const SALES_PRICING_PERMISSION_CODES = {
  READ_PRICE_LIST: 'sales.pricing.price_list.read',
  MANAGE_PRICE_LIST: 'sales.pricing.price_list.manage',
  READ_CUSTOMER_AGREEMENT: 'sales.pricing.customer_agreement.read',
  MANAGE_CUSTOMER_AGREEMENT: 'sales.pricing.customer_agreement.manage',
  PREVIEW_QUOTE_LINE: 'sales.pricing.preview_quote_line'
} as const

export const SALES_PRICING_PERMISSION_DEFINITIONS = {
  ownerService: 'sales-service',
  permissions: {
    [SALES_PRICING_PERMISSION_CODES.READ_PRICE_LIST]: {
      description: '查看销售价目表目录、头信息与行明细',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SALES_PRICING_PERMISSION_CODES.MANAGE_PRICE_LIST]: {
      description: '创建、更新、换线并切换销售价目表状态',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SALES_PRICING_PERMISSION_CODES.READ_CUSTOMER_AGREEMENT]: {
      description: '查看客户价格协议当前头版本、指定版本与版本目录',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SALES_PRICING_PERMISSION_CODES.MANAGE_CUSTOMER_AGREEMENT]: {
      description: '创建、更新、发布客户价格协议草稿并支持从销售订单行反向建草稿',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [SALES_PRICING_PERMISSION_CODES.PREVIEW_QUOTE_LINE]: {
      description: '预览报价行价格、MOQ、汇率快照与异常占位',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
