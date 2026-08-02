import { Modules, PermissionKind } from '../../prisma/generated/prisma'

export type PermissionSeedItem = {
  code: string
  module: Modules
  description?: string
  kind: PermissionKind
  externalApiEligible: boolean
}

type PermissionGroupEntry = {
  code: string
  description: string
  kind?: PermissionKind
  externalApiEligible?: boolean
}

type PermissionGroupDefinition<TCodes extends Record<string, PermissionGroupEntry>> = {
  codes: { [K in keyof TCodes]: TCodes[K]['code'] }
  items: PermissionSeedItem[]
}

/** definePermissionGroup keeps one owner-service permission group as reusable constants plus unique seed rows. */
function definePermissionGroup<TCodes extends Record<string, PermissionGroupEntry>>(
  module: Modules,
  entries: TCodes
): PermissionGroupDefinition<TCodes> {
  const codes = Object.fromEntries(
    Object.entries(entries).map(([key, value]) => [key, value.code])
  ) as PermissionGroupDefinition<TCodes>['codes']

  const uniqueEntriesByCode = new Map<string, PermissionGroupEntry>()
  for (const entry of Object.values(entries)) {
    if (!uniqueEntriesByCode.has(entry.code)) {
      uniqueEntriesByCode.set(entry.code, entry)
    }
  }

  const items = [...uniqueEntriesByCode.values()].map((entry) => ({
    code: entry.code,
    module,
    description: entry.description,
    kind: entry.kind ?? PermissionKind.BUSINESS,
    externalApiEligible: entry.externalApiEligible ?? false
  }))

  return {
    codes,
    items
  }
}

const permissionManagement = definePermissionGroup(Modules.PERMISSION_SERVICE, {
  CREATE_PERMISSION: { code: 'permission.create', description: '创建权限定义' },
  UPDATE_PERMISSION: {
    code: 'permission.update',
    description: '更新权限元数据或维护角色权限关系'
  },
  DELETE_PERMISSION: { code: 'permission.delete', description: '删除权限定义' },
  VIEW_PERMISSION: { code: 'permission.list', description: '查看权限列表' },
  VIEW_PERMISSION_DETAIL: { code: 'permission.get_by_id', description: '查看权限详情' },
  VIEW_PERMISSION_DETAIL_BY_CODE: {
    code: 'permission.get_by_code',
    description: '按权限码查看权限详情'
  },
  VIEW_AUDIT_EVENT: { code: 'permission.audit.list', description: '查看权限审计事件' },
  VIEW_NAVIGATION_ENTRY: {
    code: 'permission.navigation.entry.list',
    description: '查看导航项列表'
  },
  VIEW_NAVIGATION_ENTRY_DETAIL: {
    code: 'permission.navigation.entry.get_by_key',
    description: '查看导航项详情'
  },
  CREATE_NAVIGATION_ENTRY: {
    code: 'permission.navigation.entry.create',
    description: '创建导航项'
  },
  UPDATE_NAVIGATION_ENTRY: {
    code: 'permission.navigation.entry.update',
    description: '更新导航项'
  },
  RESOLVE_NAVIGATION_PREVIEW: {
    code: 'permission.navigation.resolve_preview',
    description: '预览导航解析结果'
  },
  VIEW_TERMINAL_ACCESS: {
    code: 'permission.terminal_access.view',
    description: '查看账号或角色终端准入'
  },
  MANAGE_ROLE_TERMINAL_ACCESS: {
    code: 'permission.terminal_access.role.manage',
    description: '维护角色默认终端准入'
  },
  MANAGE_ACCOUNT_TERMINAL_ACCESS: {
    code: 'permission.terminal_access.account.manage',
    description: '维护账号专属终端准入覆盖'
  },
  ASSIGN_ACCOUNT_ROLE: {
    code: 'permission.account.assign_roles',
    description: '为账号分配或调整角色'
  },
  REVOKE_ACCOUNT_ROLE: {
    code: 'permission.account.assign_roles',
    description: '为账号分配或调整角色'
  },
  VIEW_ACCOUNT_ROLE: { code: 'permission.account.get_roles', description: '查看账号角色' },
  SET_ACCOUNT_ROLES: {
    code: 'permission.account.assign_roles',
    description: '为账号分配或调整角色'
  },
  CREATE_POLICY: { code: 'permission.policy.create', description: '创建权限策略' },
  UPDATE_POLICY: { code: 'permission.policy.update', description: '更新权限策略' },
  DELETE_POLICY: { code: 'permission.policy.delete', description: '删除权限策略' },
  VIEW_POLICY: { code: 'permission.policy.list', description: '查看权限策略列表' }
})

const roleTemplateManagement = definePermissionGroup(Modules.PERMISSION_SERVICE, {
  CREATE: { code: 'permission.role_template.create', description: '创建系统角色模板' },
  UPDATE: { code: 'permission.role_template.update', description: '更新系统角色模板' },
  DELETE: { code: 'permission.role_template.delete', description: '删除系统角色模板' },
  ASSIGN_PERMISSIONS: {
    code: 'permission.role_template.assign_permissions',
    description: '维护系统角色模板权限'
  },
  LIST: { code: 'permission.role_template.list', description: '查看角色模板列表' },
  GET_BY_ID: { code: 'permission.role_template.get_by_id', description: '查看角色模板详情' }
})

const roleInstanceManagement = definePermissionGroup(Modules.PERMISSION_SERVICE, {
  CREATE: { code: 'permission.role_instance.create', description: '创建角色实例' },
  CREATE_FROM_TEMPLATE: {
    code: 'permission.role_instance.create_from_template',
    description: '从角色模板创建角色实例'
  },
  UPDATE: { code: 'permission.role_instance.update', description: '更新角色实例' },
  DELETE: { code: 'permission.role_instance.delete', description: '删除角色实例' },
  ASSIGN_PERMISSIONS: {
    code: 'permission.role_instance.assign_permissions',
    description: '维护角色实例权限'
  },
  SYNC_FROM_TEMPLATE: {
    code: 'permission.role_instance.sync_from_template',
    description: '从模板同步角色实例权限'
  },
  LIST: { code: 'permission.role_instance.list', description: '查看角色实例列表' },
  GET_BY_ID: { code: 'permission.role_instance.get_by_id', description: '查看角色实例详情' }
})

const permissionAccountSelf = definePermissionGroup(Modules.PERMISSION_SERVICE, {
  GET_ROLES: {
    code: 'permission.account.self.get_roles',
    description: '查看自己的角色与权限摘要'
  }
})

const identityAccountManagement = definePermissionGroup(Modules.IDENTITY_SERVICE, {
  LIST_ACCOUNT: { code: 'identity.account.list', description: '查看账号列表' },
  CREATE_ACCOUNT: { code: 'identity.account.create', description: '创建账号' },
  UPDATE_ACCOUNT_STATUS: {
    code: 'identity.account.update_status',
    description: '更新账号启停状态'
  },
  UPDATE_ACCOUNT_PROFILE: {
    code: 'identity.account.profile.update',
    description: '更新账号档案信息'
  },
  DELETE_ACCOUNT: { code: 'identity.account.delete', description: '删除账号' },
  ASSIGN_CONTACT_ASSET: {
    code: 'identity.contact.asset.assign',
    description: '分配通信资产'
  },
  UPDATE_CONTACT_ASSET: {
    code: 'identity.contact.asset.update',
    description: '更新通信资产'
  },
  SET_CONTACT_ASSET_STATUS: {
    code: 'identity.contact.asset.set_status',
    description: '更新通信资产状态'
  },
  SET_PRIMARY_CONTACT_ASSET: {
    code: 'identity.contact.asset.set_primary',
    description: '设置主通信资产'
  },
  RELEASE_CONTACT_ASSET: {
    code: 'identity.contact.asset.release',
    description: '释放通信资产'
  },
  ASSIGN_WORK_EMAIL: {
    code: 'identity.contact.work_email.assign',
    description: '分配工作邮箱'
  },
  REVOKE_WORK_EMAIL: {
    code: 'identity.contact.work_email.revoke',
    description: '回收工作邮箱'
  },
  SET_PRIMARY_WORK_EMAIL: {
    code: 'identity.contact.work_email.set_primary',
    description: '设置主工作邮箱'
  },
  SET_WORK_EMAIL_STATUS: {
    code: 'identity.contact.work_email.set_status',
    description: '更新工作邮箱状态'
  },
  ASSIGN_WORK_PHONE: {
    code: 'identity.contact.work_phone.assign',
    description: '分配工作手机号'
  },
  REVOKE_WORK_PHONE: {
    code: 'identity.contact.work_phone.revoke',
    description: '回收工作手机号'
  },
  SET_PRIMARY_WORK_PHONE: {
    code: 'identity.contact.work_phone.set_primary',
    description: '设置主工作手机号'
  },
  SET_WORK_PHONE_STATUS: {
    code: 'identity.contact.work_phone.set_status',
    description: '更新工作手机号状态'
  }
})

const identityAccountSelf = definePermissionGroup(Modules.IDENTITY_SERVICE, {
  READ: { code: 'identity.account.self.read', description: '查看自己的账号资料' },
  UPDATE_PROFILE: {
    code: 'identity.account.self.update_profile',
    description: '更新自己的账号基础资料'
  }
})

const identityMachineManagement = definePermissionGroup(Modules.IDENTITY_SERVICE, {
  CREATE_SERVICE_ACCOUNT: {
    code: 'identity.machine.service_account.create',
    description: '创建服务账号'
  },
  UPDATE_SERVICE_ACCOUNT_STATUS: {
    code: 'identity.machine.service_account.update_status',
    description: '更新服务账号状态'
  },
  CREATE_API_KEY: {
    code: 'identity.machine.api_key.create',
    description: '创建 API Key'
  },
  REVOKE_API_KEY: {
    code: 'identity.machine.api_key.revoke',
    description: '撤销 API Key'
  },
  ROTATE_API_KEY: {
    code: 'identity.machine.api_key.rotate',
    description: '轮换 API Key'
  }
})

const tenantOrgManagement = definePermissionGroup(Modules.TENANT_ORG_SERVICE, {
  LIST_TENANT: { code: 'tenant_org.tenant.list', description: '查看租户列表' },
  VIEW_TENANT_DETAIL: { code: 'tenant_org.tenant.get_by_id', description: '查看租户详情' },
  CREATE_TENANT: { code: 'tenant_org.tenant.create', description: '创建租户' },
  UPDATE_TENANT_PROFILE: {
    code: 'tenant_org.tenant.update_profile',
    description: '更新租户基础信息'
  },
  UPDATE_TENANT_STATUS: {
    code: 'tenant_org.tenant.update_status',
    description: '更新租户状态'
  },
  LIST_ORG_TREE: { code: 'tenant_org.org_unit.list_tree', description: '查看组织树' },
  VIEW_ORG_UNIT_DETAIL: {
    code: 'tenant_org.org_unit.get_by_id',
    description: '查看组织节点详情'
  },
  CREATE_ORG_UNIT: { code: 'tenant_org.org_unit.create', description: '创建组织节点' },
  UPDATE_ORG_UNIT: { code: 'tenant_org.org_unit.update', description: '更新组织节点' },
  ARCHIVE_ORG_UNIT: { code: 'tenant_org.org_unit.archive', description: '归档组织节点' }
})

const hrManagement = definePermissionGroup(Modules.HR_SERVICE, {
  LIST_EMPLOYEE: { code: 'hr.employee.list', description: '查看员工列表' },
  VIEW_EMPLOYEE_DETAIL: { code: 'hr.employee.get_by_id', description: '查看员工详情' },
  CREATE_EMPLOYEE: { code: 'hr.employee.create', description: '创建员工主档' },
  CREATE_EMPLOYMENT: { code: 'hr.employment.create', description: '创建员工任职' },
  END_EMPLOYMENT: { code: 'hr.employment.end', description: '结束员工任职' },
  CHANGE_PRIMARY_EMPLOYMENT: {
    code: 'hr.employment.change_primary',
    description: '调岗并切换主任职'
  }
})

const itemMasterManagement = definePermissionGroup(Modules.ITEM_MASTER_SERVICE, {
  LIST_ITEM_MODEL: {
    code: 'item_master.item_model.list',
    description: '查看 ItemModel 列表'
  },
  VIEW_ITEM_MODEL_DETAIL: {
    code: 'item_master.item_model.get_by_id',
    description: '查看 ItemModel 详情'
  },
  CREATE_ITEM_MODEL: {
    code: 'item_master.item_model.create',
    description: '创建 ItemModel'
  },
  MANAGE_ITEM_MODEL: {
    code: 'item_master.item_model.manage',
    description: '维护 ItemModel 基础信息、能力与分类'
  },
  LIST_ITEM: { code: 'item_master.item.list', description: '查看 Item 列表' },
  VIEW_ITEM_DETAIL: { code: 'item_master.item.get_by_id', description: '查看 Item 详情' },
  CREATE_ITEM: { code: 'item_master.item.create', description: '创建 Item' },
  UPDATE_ITEM_BASICS: {
    code: 'item_master.item.update_basics',
    description: '更新 Item 基础信息'
  },
  UPDATE_ITEM_STATUS: {
    code: 'item_master.item.update_status',
    description: '更新 Item 状态'
  },
  SET_ITEM_PRIMARY_CATEGORY: {
    code: 'item_master.item.set_primary_category',
    description: '设置或清空 Item 主分类'
  },
  LIST_ITEM_CATEGORIES: {
    code: 'item_master.item_category.list',
    description: '查看 Item 分类列表'
  },
  CREATE_ITEM_CATEGORY: {
    code: 'item_master.item_category.create',
    description: '创建 Item 分类'
  },
  UPDATE_ITEM_CATEGORY_BASICS: {
    code: 'item_master.item_category.update_basics',
    description: '更新 Item 分类基础信息'
  },
  UPDATE_ITEM_CATEGORY_STATUS: {
    code: 'item_master.item_category.update_status',
    description: '更新 Item 分类状态'
  },
  DELETE_ITEM_CATEGORY: {
    code: 'item_master.item_category.delete',
    description: '删除未被引用的叶子 Item 分类'
  },
  LIST_ATTRIBUTE: {
    code: 'item_master.attribute.list',
    description: '查看 Item 属性定义与选项'
  },
  CREATE_ATTRIBUTE: {
    code: 'item_master.attribute.create',
    description: '创建 Item 属性定义与选项'
  },
  MANAGE_ATTRIBUTE: {
    code: 'item_master.attribute.manage',
    description: '维护 Item 属性定义与选项'
  },
  LIST_PACKAGING: {
    code: 'item_master.packaging.list',
    description: '查看 Item 包装方式与包装规格'
  },
  CREATE_PACKAGING: {
    code: 'item_master.packaging.create',
    description: '创建 Item 包装方式与包装规格'
  },
  MANAGE_PACKAGING: {
    code: 'item_master.packaging.manage',
    description: '维护 Item 包装方式与包装规格'
  },
  LIST_BOM: {
    code: 'item_master.bom.list',
    description: '查看 Item BOM'
  },
  CREATE_BOM: {
    code: 'item_master.bom.create',
    description: '创建 Item BOM'
  },
  MANAGE_BOM: {
    code: 'item_master.bom.manage',
    description: '维护 Item BOM'
  },
  SET_ITEM_CAPABILITIES: {
    code: 'item_master.item.set_capabilities',
    description: '全量替换 Item 能力'
  },
  SET_ITEM_COMPOSITION: {
    code: 'item_master.item.set_composition',
    description: '全量替换 Item 组成关系'
  },
  LIST_SUPPLIER_ITEM_MAPPINGS: {
    code: 'item_master.supplier_item_mapping.list_by_item',
    description: '查看 Item 的供应商型号映射'
  },
  UPSERT_SUPPLIER_ITEM_MAPPING: {
    code: 'item_master.supplier_item_mapping.upsert',
    description: '新增或更新供应商型号映射'
  }
})

const crmManagement = definePermissionGroup(Modules.CRM_SERVICE, {
  READ_CRM_ACCOUNT: {
    code: 'crm.account.read',
    description: '查看 CRM P1 客户关系账户'
  },
  CREATE_CRM_ACCOUNT: {
    code: 'crm.account.create',
    description: '创建 CRM P1 Lead 客户关系账户'
  },
  UPDATE_CRM_ACCOUNT: {
    code: 'crm.account.update',
    description: '更新 CRM P1 客户关系账户'
  },
  CONVERT_CRM_ACCOUNT: {
    code: 'crm.account.convert',
    description: '将 CRM P1 Lead 转为 Prospect Customer'
  },
  CLAIM_CRM_ACCOUNT: {
    code: 'crm.account.claim',
    description: '认领 CRM P1 公海 Lead 或 Prospect Customer'
  },
  RELEASE_CRM_ACCOUNT: {
    code: 'crm.account.release',
    description: '释放 CRM P1 Lead 或 Prospect Customer 回公海'
  },
  MANAGE_CRM_ACCOUNT: {
    code: 'crm.account.manage',
    description: '管理 CRM P1 客户资源与公海例外动作'
  },
  VIEW_RESTRICTED_DUPLICATE: {
    code: 'crm.duplicate.viewRestricted',
    description: '查看 CRM 重复线索受限候选信息'
  },
  MANAGE_CRM_CONTACT: {
    code: 'crm.contact.manage',
    description: '维护 CRM 联系人基础记录'
  },
  MANAGE_CRM_SOURCE: {
    code: 'crm.source.manage',
    description: '维护 CRM 来源记录'
  },
  CREATE_CRM_ACTIVITY: {
    code: 'crm.activity.create',
    description: '创建 CRM 动态记录'
  },
  MANAGE_CRM_OPPORTUNITY: {
    code: 'crm.opportunity.manage',
    description: '维护 CRM 商机基础记录'
  }
})

const srmManagement = definePermissionGroup(Modules.SRM_SERVICE, {
  LIST_SUPPLIER_PROFILE: {
    code: 'srm.supplier_profile.list',
    description: '查看 SRM 供应商列表'
  },
  VIEW_SUPPLIER_DETAIL: {
    code: 'srm.supplier_profile.get_by_id',
    description: '查看 SRM 供应商详情'
  },
  CREATE_SUPPLIER_PROFILE: {
    code: 'srm.supplier_profile.create',
    description: '创建 SRM 供应商档案外壳'
  },
  UPDATE_SUPPLIER_PROFILE_BASICS: {
    code: 'srm.supplier_profile.update_basics',
    description: '更新 SRM 供应商基础信息'
  },
  BIND_SUPPLIER_TO_TENANT_PARTY: {
    code: 'srm.supplier_profile.bind_tenant_party',
    description: '绑定 SRM 供应商到租户主体'
  },
  CHANGE_SUPPLIER_STATUS: {
    code: 'srm.supplier_profile.change_status',
    description: '切换 SRM 供应商状态'
  },
  UPSERT_SUPPLIER_CONTACT: {
    code: 'srm.supplier_contact.upsert',
    description: '新增或更新 SRM 供应商联系人'
  },
  UPSERT_SUPPLIER_ADDRESS: {
    code: 'srm.supplier_address.upsert',
    description: '新增或更新 SRM 供应商地址'
  },
  LIST_SUPPLIER_OFFERINGS_BY_SUPPLIER: {
    code: 'srm.supplier_offering.list_by_supplier',
    description: '查看供应商可供应 Item 列表'
  },
  LIST_SUPPLIER_OFFERINGS_BY_ITEM: {
    code: 'srm.supplier_offering.list_by_item',
    description: '查看可供应指定 Item 的供应商列表'
  },
  UPSERT_SUPPLIER_OFFERING: {
    code: 'srm.supplier_offering.upsert',
    description: '新增或更新供应商可供应关系'
  }
})

const salesManagement = definePermissionGroup(Modules.SALES_SERVICE, {
  LIST_QUOTE: { code: 'sales.quote.list', description: '查看报价列表' },
  GET_QUOTE: { code: 'sales.quote.get_by_id', description: '查看报价详情' },
  CREATE_QUOTE: { code: 'sales.quote.create', description: '创建报价草稿' },
  UPDATE_QUOTE_DRAFT: {
    code: 'sales.quote.update_draft',
    description: '更新报价草稿'
  },
  PUBLISH_QUOTE: { code: 'sales.quote.publish', description: '正式发布报价版本' },
  CONVERT_QUOTE_TO_ORDER: {
    code: 'sales.quote.convert_to_order',
    description: '将正式报价版本转为销售订单'
  },
  LIST_ORDER: { code: 'sales.order.list', description: '查看销售订单列表' },
  VIEW_ORDER_DETAIL: {
    code: 'sales.order.get_by_id',
    description: '查看销售订单详情'
  },
  SET_ORDER_COMMERCIAL_GATE: {
    code: 'sales.order.set_commercial_gate',
    description: '设置销售订单商业放行结果'
  },
  SUBMIT_FULFILLMENT_HANDOFF: {
    code: 'sales.order.submit_fulfillment_handoff',
    description: '提交销售订单到履约边界的 handoff'
  }
})

const salesPricingManagement = definePermissionGroup(Modules.SALES_SERVICE, {
  READ_PRICE_LIST: {
    code: 'sales.pricing.price_list.read',
    description: '查看销售价目表目录、头信息与行明细'
  },
  MANAGE_PRICE_LIST: {
    code: 'sales.pricing.price_list.manage',
    description: '创建、更新、换线并切换销售价目表状态'
  },
  READ_CUSTOMER_AGREEMENT: {
    code: 'sales.pricing.customer_agreement.read',
    description: '查看客户价格协议当前头版本、指定版本与版本目录'
  },
  MANAGE_CUSTOMER_AGREEMENT: {
    code: 'sales.pricing.customer_agreement.manage',
    description: '创建、更新、发布客户价格协议草稿并支持从销售订单行反向建草稿'
  },
  PREVIEW_QUOTE_LINE: {
    code: 'sales.pricing.preview_quote_line',
    description: '预览报价行价格、MOQ、汇率快照与异常占位'
  }
})

const procurementManagement = definePermissionGroup(Modules.PROCUREMENT_SERVICE, {
  LIST_PURCHASE_REQUEST: {
    code: 'procurement.purchase_request.list',
    description: '查看采购申请列表'
  },
  GET_PURCHASE_REQUEST: {
    code: 'procurement.purchase_request.get_by_id',
    description: '查看采购申请详情'
  },
  CREATE_PURCHASE_REQUEST: {
    code: 'procurement.purchase_request.create',
    description: '创建采购申请草稿'
  },
  UPDATE_PURCHASE_REQUEST_DRAFT: {
    code: 'procurement.purchase_request.update_draft',
    description: '更新采购申请草稿'
  },
  SUBMIT_PURCHASE_REQUEST: {
    code: 'procurement.purchase_request.submit',
    description: '提交采购申请'
  },
  DECIDE_PURCHASE_REQUEST: {
    code: 'procurement.purchase_request.decide',
    description: '审批或驳回采购申请'
  },
  CANCEL_PURCHASE_REQUEST: {
    code: 'procurement.purchase_request.cancel',
    description: '取消采购申请'
  },
  CONVERT_PURCHASE_REQUEST_TO_ORDER: {
    code: 'procurement.purchase_request.convert_to_order',
    description: '将已批准采购申请转为采购订单草稿'
  },
  LIST_PURCHASE_ORDER: {
    code: 'procurement.purchase_order.list',
    description: '查看采购订单列表'
  },
  GET_PURCHASE_ORDER: {
    code: 'procurement.purchase_order.get_by_id',
    description: '查看采购订单详情'
  },
  CREATE_PURCHASE_ORDER_DRAFT: {
    code: 'procurement.purchase_order.create_draft',
    description: '创建采购订单草稿'
  },
  UPDATE_PURCHASE_ORDER_DRAFT: {
    code: 'procurement.purchase_order.update_draft',
    description: '更新采购订单草稿'
  },
  ISSUE_PURCHASE_ORDER: {
    code: 'procurement.purchase_order.issue',
    description: '正式发出采购订单'
  },
  CONFIRM_SUPPLIER_ACKNOWLEDGEMENT: {
    code: 'procurement.purchase_order.confirm_acknowledgement',
    description: '记录供应商确认摘要'
  },
  APPLY_PURCHASE_ORDER_CHANGE: {
    code: 'procurement.purchase_order.apply_change',
    description: '应用采购订单变更并留下留痕'
  },
  CANCEL_PURCHASE_ORDER: {
    code: 'procurement.purchase_order.cancel',
    description: '取消采购订单'
  },
  LIST_PURCHASE_ORDER_CHANGES: {
    code: 'procurement.purchase_order_change.list',
    description: '查看采购订单变更留痕'
  },
  LIST_RECEIVING_EXPECTATION: {
    code: 'procurement.receiving_expectation.list',
    description: '查看收货预期列表'
  },
  GET_RECEIVING_EXPECTATION: {
    code: 'procurement.receiving_expectation.get_by_id',
    description: '查看收货预期详情'
  },
  CREATE_RECEIVING_EXPECTATION: {
    code: 'procurement.receiving_expectation.create',
    description: '创建收货预期'
  },
  RECORD_RECEIVING_DISCREPANCY_RESOLUTION: {
    code: 'procurement.receiving_discrepancy.record_resolution',
    description: '记录收货差异处理摘要'
  }
})

const financeManagement = definePermissionGroup(Modules.FINANCE_SERVICE, {
  LIST_FINANCIAL_ACCOUNT: {
    code: 'finance.financial_account.list',
    description: '查看资金账户列表'
  },
  GET_FINANCIAL_ACCOUNT: {
    code: 'finance.financial_account.get_by_id',
    description: '查看资金账户详情'
  },
  CREATE_FINANCIAL_ACCOUNT: {
    code: 'finance.financial_account.create',
    description: '创建资金账户'
  },
  UPDATE_FINANCIAL_ACCOUNT_BASICS: {
    code: 'finance.financial_account.update_basics',
    description: '更新资金账户基础信息'
  },
  LIST_ACCOUNT_TRANSACTION: {
    code: 'finance.account_transaction.list',
    description: '查看账户流水列表'
  },
  IMPORT_ACCOUNT_TRANSACTION: {
    code: 'finance.account_transaction.import',
    description: '批量导入账户流水'
  },
  RECORD_ACCOUNT_TRANSACTION: {
    code: 'finance.account_transaction.record',
    description: '手工登记账户流水'
  },
  REGISTER_CUSTOMER_FINANCIAL_ACCOUNT: {
    code: 'finance.customer_financial_account.register',
    description: '登记客户付款账号'
  },
  GET_EXCHANGE_RATE: {
    code: 'finance.exchange_rate.get',
    description: '查看标准汇率'
  },
  SET_EXCHANGE_RATE: {
    code: 'finance.exchange_rate.set',
    description: '设置标准汇率'
  },
  LIST_RECEIVABLE_SCHEDULE: {
    code: 'finance.receivable_schedule.list',
    description: '查看应收计划列表'
  },
  GET_RECEIVABLE_SCHEDULE: {
    code: 'finance.receivable_schedule.get_by_id',
    description: '查看应收计划详情'
  },
  CREATE_RECEIVABLE_SCHEDULE_FROM_SALES_ORDER: {
    code: 'finance.receivable_schedule.create_from_sales_order',
    description: '从销售订单建立应收计划'
  },
  GET_FINANCE_RELEASE_SIGNAL: {
    code: 'finance.finance_release_signal.get',
    description: '查看财务放行信号'
  },
  SET_FINANCE_RELEASE_SIGNAL: {
    code: 'finance.finance_release_signal.set',
    description: '设置财务放行信号'
  },
  LIST_PAYMENT_ALLOCATION: {
    code: 'finance.payment_allocation.list',
    description: '查看收款核销结果'
  },
  ALLOCATE_PAYMENT_TO_RECEIVABLE: {
    code: 'finance.payment_allocation.allocate_to_receivable',
    description: '将收款流水核销到应收计划'
  },
  READ_PAYABLE: {
    code: 'finance.payable.read',
    description: '查看应付计划、付款申请、付款执行与付款核销摘要'
  },
  CREATE_PAYABLE_FROM_PURCHASE_ORDER: {
    code: 'finance.payable.create_from_purchase_order',
    description: '从采购订单建立应付计划'
  },
  ADJUST_PAYABLE_FROM_PURCHASE_ORDER_CHANGE: {
    code: 'finance.payable.adjust_from_purchase_order_change',
    description: '根据采购订单变更调整应付计划'
  },
  CREATE_PAYMENT_REQUEST: {
    code: 'finance.payment_request.create',
    description: '创建付款申请'
  },
  DECIDE_PAYMENT_REQUEST: {
    code: 'finance.payment_request.decide',
    description: '审批或驳回付款申请'
  },
  CREATE_PAYMENT_EXECUTION: {
    code: 'finance.payment_execution.create',
    description: '记录付款执行动作'
  },
  CREATE_PAYMENT_ALLOCATION: {
    code: 'finance.payment_allocation.create',
    description: '将付款流水核销到应付计划'
  }
})

const publicEntryShortLinkManagement = definePermissionGroup(Modules.PUBLIC_ENTRY_SERVICE, {
  READ: { code: 'public-entry.short-link.read', description: '查看 ShortLink 公开入口' },
  CREATE: { code: 'public-entry.short-link.create', description: '创建 ShortLink 公开入口' },
  UPDATE: { code: 'public-entry.short-link.update', description: '更新 ShortLink 公开入口' },
  DISABLE: { code: 'public-entry.short-link.disable', description: '禁用 ShortLink 公开入口' },
  ARCHIVE: { code: 'public-entry.short-link.archive', description: '归档 ShortLink 公开入口' },
  STATS_READ: { code: 'public-entry.short-link.stats.read', description: '查看 ShortLink 访问摘要' }
})

const publicEntryBusinessCardManagement = definePermissionGroup(Modules.PUBLIC_ENTRY_SERVICE, {
  READ: { code: 'public-entry.business-card.read', description: '查看员工数字名片' },
  MANAGE: { code: 'public-entry.business-card.manage', description: '维护员工数字名片配置' },
  ENABLE: { code: 'public-entry.business-card.enable', description: '启用员工数字名片' },
  DISABLE: { code: 'public-entry.business-card.disable', description: '禁用员工数字名片' },
  PUBLIC_ENTRY_MANAGE: {
    code: 'public-entry.business-card.public-entry.manage',
    description: '绑定或刷新员工数字名片主公开入口'
  },
  STATS_READ: {
    code: 'public-entry.business-card.stats.read',
    description: '查看员工数字名片访问摘要'
  }
})

const wmsManagement = definePermissionGroup(Modules.WMS_SERVICE, {
  READ_WAREHOUSE: {
    code: 'wms.warehouse.read',
    description: '查看仓库列表与仓库详情'
  },
  READ_LOCATION: {
    code: 'wms.location.read',
    description: '查看库位列表与库位详情'
  },
  READ_RECEIPT: {
    code: 'wms.receipt.read',
    description: '查看收货单与收货行目录及详情'
  },
  MANAGE_RECEIPT: {
    code: 'wms.receipt.manage',
    description: '创建收货草稿、替换草稿行并执行过账或取消'
  },
  READ_INVENTORY: {
    code: 'wms.inventory.read',
    description: '查看库存余额与库存总账目录及详情'
  }
})

const mesManagement = definePermissionGroup(Modules.MES_SERVICE, {
  READ_PRODUCTION_SPEC: {
    code: 'mes.production_spec.read',
    description: '查看 MES 生产规格目录、详情与模具适配解析'
  },
  MANAGE_PRODUCTION_SPEC: {
    code: 'mes.production_spec.manage',
    description: '创建、更新、启用与退役 MES 生产规格'
  },
  READ_MOLD_DESIGN: {
    code: 'mes.mold_design.read',
    description: '查看模具设计目录与详情'
  },
  MANAGE_MOLD_DESIGN: {
    code: 'mes.mold_design.manage',
    description: '登记和维护模具设计'
  },
  READ_PRODUCTION_MOLD: {
    code: 'mes.production_mold.read',
    description: '查看生产模具、当前位置、安装、寿命与预警摘要'
  },
  MANAGE_PRODUCTION_MOLD: {
    code: 'mes.production_mold.manage',
    description: '登记、转移、安装、卸下、报废生产模具'
  },
  READ_TOOLING_INSTALLATION: {
    code: 'mes.tooling_installation.read',
    description: '查看工装安装、当前位置、安装历史与日模具清单'
  },
  MANAGE_TOOLING_INSTALLATION: {
    code: 'mes.tooling_installation.manage',
    description: '维护工装安装、卸下、移动与安装位置'
  },
  RECORD_MOLD_USAGE: {
    code: 'mes.mold_usage.record',
    description: '记录产线当日模具注浆或其他模具使用事实'
  },
  MANAGE_MOLD_LIFE: {
    code: 'mes.mold_life.manage',
    description: '调整模具寿命计数并确认寿命预警'
  }
})

const authManagement = definePermissionGroup(Modules.AUTH_SERVICE, {
  VIEW_AUDIT_EVENT: { code: 'auth.audit.list', description: '查看认证审计事件' },
  BOOTSTRAP_ACCOUNT_CREDENTIALS: {
    code: 'auth.account_credentials.bootstrap',
    description: '初始化账号登录凭据'
  },
  MANAGE_ACCOUNT_LOGIN_METHODS: {
    code: 'auth.account_login_methods.manage',
    description: '管理账号登录方式'
  },
  MANAGE_TENANT_MFA_POLICY: {
    code: 'auth.mfa_policy.manage',
    description: '管理租户 MFA 策略'
  },
  MANAGE_PLATFORM_MFA_POLICY: {
    code: 'auth.platform_mfa_policy.manage',
    description: '管理平台 MFA 策略'
  }
})

const authSelfManagement = definePermissionGroup(Modules.AUTH_SERVICE, {
  LIST_LOGIN_METHODS: {
    code: 'auth.login_method.self.list',
    description: '查看自己的登录方式'
  },
  MANAGE_LOGIN_METHODS: {
    code: 'auth.login_method.self.manage',
    description: '管理自己的登录方式'
  },
  LIST_SESSIONS: { code: 'auth.session.self.list', description: '查看自己的会话' },
  REVOKE_SESSION: { code: 'auth.session.self.revoke', description: '撤销自己的会话' }
})

const authSessionManagement = definePermissionGroup(Modules.AUTH_SERVICE, {
  ADMIN_VIEW_USER_SESSIONS: {
    code: 'auth.session.admin.view',
    description: '查看用户会话'
  },
  ADMIN_REVOKE_SESSION: {
    code: 'auth.session.admin.revoke',
    description: '撤销用户会话'
  }
})

const authInternal = definePermissionGroup(Modules.AUTH_SERVICE, {
  EXTERNAL_API_KEY_VERIFIER_VERSION_COMPROMISE: {
    code: 'auth.internal.external_api_key.verifier_version.compromise',
    description: '触发 External API Key verifier version compromise 的内部安全处置调用',
    kind: PermissionKind.INTERNAL,
    externalApiEligible: false
  }
})

const collaborationTask = definePermissionGroup(Modules.COLLABORATION_SERVICE, {
  ASSIGN: {
    code: 'collaboration.task.assign',
    description: '指派协作任务给租户内其他账号'
  }
})

const collaborationAnnotation = definePermissionGroup(Modules.COLLABORATION_SERVICE, {
  CREATE: {
    code: 'collaboration.annotation.create',
    description: '在支持的业务对象上创建协作备注'
  },
  MANAGE: {
    code: 'collaboration.annotation.manage',
    description: '治理协作备注，包括置顶、取消置顶或删除他人备注'
  }
})

const terminalDeviceManagement = definePermissionGroup(Modules.TERMINAL_DEVICE_SERVICE, {
  CREATE_ENROLLMENT: {
    code: 'terminal-device.enrollment.create',
    description: '创建受管终端设备 enrollment'
  },
  REVOKE_ENROLLMENT: {
    code: 'terminal-device.enrollment.revoke',
    description: '撤销未使用的受管终端设备 enrollment'
  },
  READ_DEVICE: {
    code: 'terminal-device.read',
    description: '查看受管终端设备列表与基础详情'
  },
  READ_SENSITIVE_DEVICE: {
    code: 'terminal-device.sensitive.read',
    description: '查看受管终端设备敏感诊断标识与运行详情'
  },
  DISABLE_DEVICE: {
    code: 'terminal-device.status.disable',
    description: '禁用受管终端设备'
  },
  MARK_LOST_DEVICE: {
    code: 'terminal-device.status.mark-lost',
    description: '标记受管终端设备丢失'
  },
  MARK_MAINTENANCE_DEVICE: {
    code: 'terminal-device.status.mark-maintenance',
    description: '标记受管终端设备维修中'
  },
  RESTORE_ACTIVE_DEVICE: {
    code: 'terminal-device.status.restore-active',
    description: '将受管终端设备恢复为可用状态'
  },
  MANAGE_VERSION_POLICY: {
    code: 'terminal-device.version-policy.manage',
    description: '维护受管终端设备版本策略'
  },
  READ_AUDIT: {
    code: 'terminal-device.audit.read',
    description: '查看受管终端设备治理审计'
  }
})

const browserExtensionDesigner = definePermissionGroup(Modules.PERMISSION_SERVICE, {
  PROJECT_CREATE: {
    code: 'extension.designer.project.create',
    description: '在浏览器插件 Designer Workspace 中创建选品项目'
  },
  PRODUCT_COLLECT: {
    code: 'extension.designer.product.collect',
    description: '在浏览器插件 Designer Workspace 中收藏候选产品'
  },
  SUBMIT_TO_OES: {
    code: 'extension.designer.submit_to_oes',
    description: '将浏览器插件 Designer Workspace 选品项目提交到 OES'
  }
})

const browserActivityAudit = definePermissionGroup(Modules.PERMISSION_SERVICE, {
  POLICY_READ: {
    code: 'browser_activity.policy.read',
    description: '查看租户浏览器访问审计策略'
  },
  POLICY_MANAGE: {
    code: 'browser_activity.policy.manage',
    description: '维护租户浏览器访问审计开关与保留周期'
  },
  OVERVIEW_READ: {
    code: 'browser_activity.overview.read',
    description: '查看租户浏览器访问审计概览与员工活跃浏览排名'
  },
  EMPLOYEE_DETAIL_READ: {
    code: 'browser_activity.employee_detail.read',
    description: '查看员工浏览器访问时间线与访问事实明细'
  },
  URL_DETAIL_READ: {
    code: 'browser_activity.url_detail.read',
    description: '查询浏览器访问审计 URL 与 domain 明细'
  }
})

const siteManagement = definePermissionGroup(Modules.SITE_SERVICE, {
  READ: { code: 'site.management.read', description: '查看站点治理工作台、站点卡片与运行状态' },
  MANAGE: { code: 'site.management.manage', description: '创建、更新或禁用站点配置' },
  LOCALE_MANAGE: { code: 'site.management.locale.manage', description: '维护站点语言生命周期' },
  PRODUCT_MANAGE: { code: 'site.management.product.manage', description: '维护站点产品发布配置' },
  CONTENT_MANAGE: {
    code: 'site.management.content.manage',
    description: '维护站点 Blog / News 内容'
  },
  SYNC: { code: 'site.management.sync', description: '执行站点 public view 同步和 webhook 重投递' },
  CREDENTIAL_MANAGE: {
    code: 'site.management.credential.manage',
    description: '生成、轮换或吊销站点 runtime credential'
  },
  AUDIT_READ: { code: 'site.management.audit.read', description: '查看站点治理审计日志' },
  PREVIEW: { code: 'site.management.preview', description: '签发站点草稿预览 token' }
})

export const PERMISSION_MANAGEMENT_PERMISSION_CODES = permissionManagement.codes
export const ROLE_TEMPLATE_PERMISSION_CODES = roleTemplateManagement.codes
export const ROLE_INSTANCE_PERMISSION_CODES = roleInstanceManagement.codes
export const PERMISSION_ACCOUNT_SELF_PERMISSION_CODES = permissionAccountSelf.codes
export const IDENTITY_ACCOUNT_PERMISSION_CODES = identityAccountManagement.codes
export const IDENTITY_ACCOUNT_SELF_PERMISSION_CODES = identityAccountSelf.codes
export const IDENTITY_MACHINE_PERMISSION_CODES = identityMachineManagement.codes
export const IDENTITY_TENANT_PERMISSION_CODES = {} as const
export const TENANT_ORG_MANAGEMENT_PERMISSION_CODES = tenantOrgManagement.codes
export const HR_MANAGEMENT_PERMISSION_CODES = hrManagement.codes
export const ITEM_MASTER_MANAGEMENT_PERMISSION_CODES = itemMasterManagement.codes
export const CRM_MANAGEMENT_PERMISSION_CODES = crmManagement.codes
export const SRM_MANAGEMENT_PERMISSION_CODES = srmManagement.codes
export const SALES_MANAGEMENT_PERMISSION_CODES = salesManagement.codes
export const SALES_PRICING_PERMISSION_CODES = salesPricingManagement.codes
export const PROCUREMENT_MANAGEMENT_PERMISSION_CODES = procurementManagement.codes
export const FINANCE_MANAGEMENT_PERMISSION_CODES = financeManagement.codes
export const PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES = publicEntryShortLinkManagement.codes
export const PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES = publicEntryBusinessCardManagement.codes
export const WMS_MANAGEMENT_PERMISSION_CODES = wmsManagement.codes
export const MES_MANAGEMENT_PERMISSION_CODES = mesManagement.codes
export const AUTH_MANAGEMENT_PERMISSION_CODES = authManagement.codes
export const AUTH_SELF_PERMISSION_CODES = authSelfManagement.codes
export const AUTH_SESSION_PERMISSION_CODES = authSessionManagement.codes
export const AUTH_INTERNAL_PERMISSION_CODES = authInternal.codes
export const COLLABORATION_TASK_PERMISSION_CODES = collaborationTask.codes
export const COLLABORATION_ANNOTATION_PERMISSION_CODES = collaborationAnnotation.codes
export const TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES = terminalDeviceManagement.codes
export const BROWSER_EXTENSION_DESIGNER_PERMISSION_CODES = browserExtensionDesigner.codes
export const BROWSER_ACTIVITY_AUDIT_PERMISSION_CODES = browserActivityAudit.codes
export const SITE_MANAGEMENT_PERMISSION_CODES = siteManagement.codes

/** DEPRECATED_PERMISSION_CODES tracks legacy permission rows that should be cleaned from local/dev seed data. */
export const DEPRECATED_PERMISSION_CODES = [
  'permission.role.create',
  'permission.role.update',
  'permission.role.delete_by_id',
  'permission.role.list',
  'permission.role.get_by_id',
  'permission.role_template.delete_by_id',
  'permission.role_template.permission.assign',
  'permission.role_template.permission.revoke',
  'permission.role_instance.delete_by_id',
  'permission.role_instance.permission.assign',
  'permission.role_instance.permission.revoke',
  'identity.org.membership.add',
  'identity.org.membership.remove',
  'identity.org.membership.set_primary'
] as const

/** PERMISSION_CODE_SEED_ITEMS publishes the owner-service permission catalog consumed by permission foundation sync. */
export const PERMISSION_CODE_SEED_ITEMS: PermissionSeedItem[] = [
  ...permissionManagement.items,
  ...roleTemplateManagement.items,
  ...roleInstanceManagement.items,
  ...permissionAccountSelf.items,
  ...identityAccountManagement.items,
  ...identityAccountSelf.items,
  ...identityMachineManagement.items,
  ...tenantOrgManagement.items,
  ...hrManagement.items,
  ...itemMasterManagement.items,
  ...crmManagement.items,
  ...srmManagement.items,
  ...salesManagement.items,
  ...salesPricingManagement.items,
  ...procurementManagement.items,
  ...financeManagement.items,
  ...publicEntryShortLinkManagement.items,
  ...publicEntryBusinessCardManagement.items,
  ...wmsManagement.items,
  ...mesManagement.items,
  ...authManagement.items,
  ...authSelfManagement.items,
  ...authSessionManagement.items,
  ...authInternal.items,
  ...collaborationTask.items,
  ...collaborationAnnotation.items,
  ...terminalDeviceManagement.items,
  ...browserExtensionDesigner.items,
  ...browserActivityAudit.items,
  ...siteManagement.items
]
