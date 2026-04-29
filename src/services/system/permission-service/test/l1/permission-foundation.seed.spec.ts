import {
  CRM_MANAGEMENT_PERMISSION_CODES,
  FINANCE_MANAGEMENT_PERMISSION_CODES,
  HR_MANAGEMENT_PERMISSION_CODES,
  IDENTITY_ACCOUNT_PERMISSION_CODES,
  ITEM_MASTER_MANAGEMENT_PERMISSION_CODES,
  PROCUREMENT_MANAGEMENT_PERMISSION_CODES,
  SALES_MANAGEMENT_PERMISSION_CODES,
  SRM_MANAGEMENT_PERMISSION_CODES,
  TENANT_ORG_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import { Modules } from '../../prisma/generated/prisma'
import { buildPermissionSeedItems } from '../../src/scripts/sync-permission-codes'

describe('permission foundation seed', () => {
  it('publishes account-management identity permission rows', () => {
    const itemByCode = new Map(buildPermissionSeedItems().map((item) => [item.code, item]))

    expect(itemByCode.get(IDENTITY_ACCOUNT_PERMISSION_CODES.LIST_ACCOUNT)).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(itemByCode.get(IDENTITY_ACCOUNT_PERMISSION_CODES.CREATE_ACCOUNT)).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(itemByCode.get(IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_ACCOUNT_STATUS)).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(itemByCode.get(IDENTITY_ACCOUNT_PERMISSION_CODES.DELETE_ACCOUNT)).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
  })

  it('publishes tenant management permission rows for the tenant-org entry', () => {
    const itemByCode = new Map(buildPermissionSeedItems().map((item) => [item.code, item]))

    expect(itemByCode.get(TENANT_ORG_MANAGEMENT_PERMISSION_CODES.LIST_TENANT)).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(itemByCode.get(TENANT_ORG_MANAGEMENT_PERMISSION_CODES.CREATE_TENANT)).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(
      itemByCode.get(TENANT_ORG_MANAGEMENT_PERMISSION_CODES.VIEW_TENANT_DETAIL)
    ).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(
      itemByCode.get(TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_TENANT_PROFILE)
    ).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(
      itemByCode.get(TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_TENANT_STATUS)
    ).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(
      itemByCode.get(TENANT_ORG_MANAGEMENT_PERMISSION_CODES.LIST_ORG_TREE)
    ).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(
      itemByCode.get(TENANT_ORG_MANAGEMENT_PERMISSION_CODES.VIEW_ORG_UNIT_DETAIL)
    ).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(
      itemByCode.get(TENANT_ORG_MANAGEMENT_PERMISSION_CODES.CREATE_ORG_UNIT)
    ).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(
      itemByCode.get(TENANT_ORG_MANAGEMENT_PERMISSION_CODES.UPDATE_ORG_UNIT)
    ).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(
      itemByCode.get(TENANT_ORG_MANAGEMENT_PERMISSION_CODES.ARCHIVE_ORG_UNIT)
    ).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
  })

  it('publishes HR management permission rows for the tenant HR entry', () => {
    const itemByCode = new Map(buildPermissionSeedItems().map((item) => [item.code, item]))

    expect(itemByCode.get(HR_MANAGEMENT_PERMISSION_CODES.LIST_EMPLOYEE)).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(itemByCode.get(HR_MANAGEMENT_PERMISSION_CODES.VIEW_EMPLOYEE_DETAIL)).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(itemByCode.get(HR_MANAGEMENT_PERMISSION_CODES.CREATE_EMPLOYEE)).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(itemByCode.get(HR_MANAGEMENT_PERMISSION_CODES.CREATE_EMPLOYMENT)).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(itemByCode.get(HR_MANAGEMENT_PERMISSION_CODES.END_EMPLOYMENT)).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
    expect(itemByCode.get(HR_MANAGEMENT_PERMISSION_CODES.CHANGE_PRIMARY_EMPLOYMENT)).toMatchObject({
      module: Modules.IDENTITY_SERVICE
    })
  })

  it('publishes item management permission rows for the tenant master-data entry', () => {
    const itemByCode = new Map(buildPermissionSeedItems().map((item) => [item.code, item]))

    expect(itemByCode.get(ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM)).toMatchObject({
      module: Modules.ENTITY_SERVICE
    })
    expect(itemByCode.get(ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_DETAIL)).toMatchObject({
      module: Modules.ENTITY_SERVICE
    })
    expect(itemByCode.get(ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM)).toMatchObject({
      module: Modules.ENTITY_SERVICE
    })
    expect(itemByCode.get(ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_BASICS)).toMatchObject({
      module: Modules.ENTITY_SERVICE
    })
    expect(itemByCode.get(ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_STATUS)).toMatchObject({
      module: Modules.ENTITY_SERVICE
    })
    expect(itemByCode.get(ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.SET_ITEM_CAPABILITIES)).toMatchObject({
      module: Modules.ENTITY_SERVICE
    })
    expect(itemByCode.get(ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.SET_ITEM_COMPOSITION)).toMatchObject({
      module: Modules.ENTITY_SERVICE
    })
    expect(itemByCode.get(ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_ITEM_MAPPINGS)).toMatchObject({
      module: Modules.ENTITY_SERVICE
    })
    expect(itemByCode.get(ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_ITEM_MAPPING)).toMatchObject({
      module: Modules.ENTITY_SERVICE
    })
  })

  it('publishes supplier management permission rows for the tenant supplier entry', () => {
    const itemByCode = new Map(buildPermissionSeedItems().map((item) => [item.code, item]))

    expect(itemByCode.get(SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_PROFILE)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SRM_MANAGEMENT_PERMISSION_CODES.VIEW_SUPPLIER_DETAIL)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SRM_MANAGEMENT_PERMISSION_CODES.CREATE_SUPPLIER_PROFILE)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(
      itemByCode.get(SRM_MANAGEMENT_PERMISSION_CODES.UPDATE_SUPPLIER_PROFILE_BASICS)
    ).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(
      itemByCode.get(SRM_MANAGEMENT_PERMISSION_CODES.BIND_SUPPLIER_TO_TENANT_PARTY)
    ).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SRM_MANAGEMENT_PERMISSION_CODES.CHANGE_SUPPLIER_STATUS)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_CONTACT)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_ADDRESS)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(
      itemByCode.get(SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_OFFERINGS_BY_SUPPLIER)
    ).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(
      itemByCode.get(SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_OFFERINGS_BY_ITEM)
    ).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_OFFERING)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
  })

  it('publishes customer management permission rows for the tenant customer entry', () => {
    const itemByCode = new Map(buildPermissionSeedItems().map((item) => [item.code, item]))

    expect(itemByCode.get(CRM_MANAGEMENT_PERMISSION_CODES.LIST_CUSTOMER_ACCOUNT)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(CRM_MANAGEMENT_PERMISSION_CODES.VIEW_CUSTOMER_ACCOUNT_DETAIL)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CUSTOMER_ACCOUNT)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(
      itemByCode.get(CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CUSTOMER_ACCOUNT_BASICS)
    ).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(
      itemByCode.get(CRM_MANAGEMENT_PERMISSION_CODES.BIND_CUSTOMER_ACCOUNT_TO_TENANT_PARTY)
    ).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(CRM_MANAGEMENT_PERMISSION_CODES.CHANGE_CUSTOMER_STATUS)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(CRM_MANAGEMENT_PERMISSION_CODES.UPSERT_CUSTOMER_CONTACT)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(CRM_MANAGEMENT_PERMISSION_CODES.UPSERT_CUSTOMER_ADDRESS)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
  })

  it('publishes sales quote-order permission rows for the tenant sales entry', () => {
    const itemByCode = new Map(buildPermissionSeedItems().map((item) => [item.code, item]))

    expect(itemByCode.get(SALES_MANAGEMENT_PERMISSION_CODES.LIST_QUOTE)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SALES_MANAGEMENT_PERMISSION_CODES.GET_QUOTE)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SALES_MANAGEMENT_PERMISSION_CODES.CREATE_QUOTE)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SALES_MANAGEMENT_PERMISSION_CODES.UPDATE_QUOTE_DRAFT)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SALES_MANAGEMENT_PERMISSION_CODES.PUBLISH_QUOTE)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SALES_MANAGEMENT_PERMISSION_CODES.CONVERT_QUOTE_TO_ORDER)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SALES_MANAGEMENT_PERMISSION_CODES.LIST_ORDER)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SALES_MANAGEMENT_PERMISSION_CODES.VIEW_ORDER_DETAIL)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SALES_MANAGEMENT_PERMISSION_CODES.SET_ORDER_COMMERCIAL_GATE)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(SALES_MANAGEMENT_PERMISSION_CODES.SUBMIT_FULFILLMENT_HANDOFF)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
  })

  it('publishes finance phase 1A permission rows for the tenant finance entry', () => {
    const itemByCode = new Map(buildPermissionSeedItems().map((item) => [item.code, item]))

    expect(itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.LIST_FINANCIAL_ACCOUNT)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.GET_FINANCIAL_ACCOUNT)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_FINANCIAL_ACCOUNT)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(
      itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.UPDATE_FINANCIAL_ACCOUNT_BASICS)
    ).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.LIST_ACCOUNT_TRANSACTION)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.IMPORT_ACCOUNT_TRANSACTION)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.RECORD_ACCOUNT_TRANSACTION)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(
      itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.REGISTER_CUSTOMER_FINANCIAL_ACCOUNT)
    ).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.GET_EXCHANGE_RATE)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.SET_EXCHANGE_RATE)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.LIST_RECEIVABLE_SCHEDULE)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.GET_RECEIVABLE_SCHEDULE)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(
      itemByCode.get(
        FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_RECEIVABLE_SCHEDULE_FROM_SALES_ORDER
      )
    ).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.GET_FINANCE_RELEASE_SIGNAL)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.SET_FINANCE_RELEASE_SIGNAL)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.LIST_PAYMENT_ALLOCATION)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(
      itemByCode.get(FINANCE_MANAGEMENT_PERMISSION_CODES.ALLOCATE_PAYMENT_TO_RECEIVABLE)
    ).toMatchObject({
      module: Modules.EPR_SERVICE
    })
  })

  it('publishes procurement permission rows for the tenant procurement entry', () => {
    const itemByCode = new Map(buildPermissionSeedItems().map((item) => [item.code, item]))

    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_REQUEST)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_PURCHASE_REQUEST)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_PURCHASE_REQUEST)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.UPDATE_PURCHASE_REQUEST_DRAFT)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.SUBMIT_PURCHASE_REQUEST)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.DECIDE_PURCHASE_REQUEST)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CANCEL_PURCHASE_REQUEST)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CONVERT_PURCHASE_REQUEST_TO_ORDER)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_ORDER)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_PURCHASE_ORDER)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_PURCHASE_ORDER_DRAFT)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.UPDATE_PURCHASE_ORDER_DRAFT)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.ISSUE_PURCHASE_ORDER)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CONFIRM_SUPPLIER_ACKNOWLEDGEMENT)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.APPLY_PURCHASE_ORDER_CHANGE)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CANCEL_PURCHASE_ORDER)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_ORDER_CHANGES)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_RECEIVING_EXPECTATION)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_RECEIVING_EXPECTATION)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_RECEIVING_EXPECTATION)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
    expect(itemByCode.get(PROCUREMENT_MANAGEMENT_PERMISSION_CODES.RECORD_RECEIVING_DISCREPANCY_RESOLUTION)).toMatchObject({
      module: Modules.EPR_SERVICE
    })
  })
})
