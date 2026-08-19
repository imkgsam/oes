import {
  Modules,
  PermissionKind,
  PermissionScopeLevel,
  PrismaClient,
  RoleKind,
  ScopeLevel
} from '../../prisma/generated/prisma'
import {
  AUTH_MANAGEMENT_PERMISSION_CODES,
  AUTH_SESSION_PERMISSION_CODES,
  COLLABORATION_TASK_PERMISSION_CODES,
  CRM_MANAGEMENT_PERMISSION_CODES,
  CRM_INTERNAL_PERMISSION_CODES,
  FINANCE_MANAGEMENT_PERMISSION_CODES,
  HR_MANAGEMENT_PERMISSION_CODES,
  IDENTITY_ACCOUNT_PERMISSION_CODES,
  ITEM_MASTER_MANAGEMENT_PERMISSION_CODES,
  PROCUREMENT_MANAGEMENT_PERMISSION_CODES,
  PROCUREMENT_INTERNAL_PERMISSION_CODES,
  PERMISSION_MANAGEMENT_PERMISSION_CODES,
  SALES_MANAGEMENT_PERMISSION_CODES,
  SRM_MANAGEMENT_PERMISSION_CODES,
  SRM_INTERNAL_PERMISSION_CODES,
  TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES,
  TENANT_ORG_MANAGEMENT_PERMISSION_CODES,
  PermissionAssignee
} from '@oes/common/authorization'
import {
  buildNavigationFoundationLandingSeeds,
  buildNavigationFoundationVisibilitySeeds,
  DEFAULT_NAVIGATION_ENTRIES,
  DEPRECATED_NAVIGATION_ENTRY_KEYS
} from './navigation-foundation'
import { BUILT_IN_ROLE_TEMPLATES } from './role-foundation'
import { syncBuiltInRoleInstanceBaselines } from './role-instance-foundation'
import { PERMISSION_CODE_SEED_ITEMS } from './permission-catalog'

type PermissionSeedItem = {
  code: string
  module: Modules
  description?: string
  kind: PermissionKind
  assignableTo: PermissionAssignee[]
  externalApiEligible: boolean
  allowedScopeLevels: PermissionScopeLevel[]
  definitionFingerprint: string
}

type RawPermissionSeedItem = Omit<
  PermissionSeedItem,
  'kind' | 'externalApiEligible' | 'allowedScopeLevels' | 'definitionFingerprint'
> &
  Partial<
    Pick<
      PermissionSeedItem,
      'kind' | 'externalApiEligible' | 'allowedScopeLevels' | 'definitionFingerprint'
    >
  >

const PERMISSION_DESCRIPTION_BY_CODE: Readonly<Record<string, string>> = {
  'permission.create': '创建权限定义',
  'permission.update': '更新权限元数据或维护角色权限关系',
  'permission.delete': '删除权限定义',
  'permission.list': '查看权限列表',
  'permission.get_by_id': '查看权限详情',
  'permission.get_by_code': '按权限码查看权限详情',
  'permission.audit.list': '查看权限审计事件',
  'permission.navigation.entry.list': '查看导航项列表',
  'permission.navigation.entry.get_by_key': '查看导航项详情',
  'permission.navigation.entry.create': '创建导航项',
  'permission.navigation.entry.update': '更新导航项',
  'permission.navigation.resolve_preview': '预览导航解析结果',
  'permission.role_template.create': '创建角色模板',
  'permission.role_template.update': '更新角色模板',
  'permission.role_template.delete_by_id': '删除角色模板',
  'permission.role_template.list': '查看角色模板列表',
  'permission.role_template.get_by_id': '查看角色模板详情',
  'permission.role_template.permission.assign': '为角色模板分配权限',
  'permission.role_template.permission.revoke': '从角色模板撤销权限',
  'permission.role_instance.create': '创建角色实例',
  'permission.role_instance.create_from_template': '从角色模板创建角色实例',
  'permission.role_instance.update': '更新角色实例',
  'permission.role_instance.delete_by_id': '删除角色实例',
  'permission.role_instance.list': '查看角色实例列表',
  'permission.role_instance.get_by_id': '查看角色实例详情',
  'permission.role_instance.permission.assign': '为角色实例分配权限',
  'permission.role_instance.permission.revoke': '从角色实例撤销权限',
  'permission.account.assign_roles': '为账号分配或调整角色',
  'permission.account.get_roles': '查看账号角色',
  'permission.policy.create': '创建权限策略',
  'permission.policy.update': '更新权限策略',
  'permission.policy.delete': '删除权限策略',
  'permission.policy.list': '查看权限策略列表',
  'identity.account.list': '查看账号列表',
  'identity.account.create': '创建账号',
  'identity.account.update_status': '更新账号启停状态',
  'identity.account.profile.update': '更新账号档案信息',
  'identity.account.delete': '删除账号',
  'identity.contact.asset.assign': '分配通信资产',
  'identity.contact.asset.update': '更新通信资产',
  'identity.contact.asset.set_status': '更新通信资产状态',
  'identity.contact.asset.set_primary': '设置主通信资产',
  'identity.contact.asset.release': '释放通信资产',
  'identity.contact.work_email.assign': '分配工作邮箱',
  'identity.contact.work_email.revoke': '回收工作邮箱',
  'identity.contact.work_email.set_primary': '设置主工作邮箱',
  'identity.contact.work_email.set_status': '更新工作邮箱状态',
  'identity.contact.work_phone.assign': '分配工作手机号',
  'identity.contact.work_phone.revoke': '回收工作手机号',
  'identity.contact.work_phone.set_primary': '设置主工作手机号',
  'identity.contact.work_phone.set_status': '更新工作手机号状态',
  'tenant_org.tenant.list': '查看租户列表',
  'tenant_org.tenant.get_by_id': '查看租户详情',
  'tenant_org.tenant.create': '创建租户',
  'tenant_org.tenant.update_profile': '更新租户基础信息',
  'tenant_org.tenant.update_status': '更新租户状态',
  'tenant_org.org_unit.list_tree': '查看组织树',
  'tenant_org.org_unit.get_by_id': '查看组织节点详情',
  'tenant_org.org_unit.create': '创建组织节点',
  'tenant_org.org_unit.update': '更新组织节点',
  'tenant_org.org_unit.archive': '归档组织节点',
  'hr.employee.list': '查看员工列表',
  'hr.employee.get_by_id': '查看员工详情',
  'hr.employee.create': '创建员工主档',
  'hr.employment.create': '创建员工任职',
  'hr.employment.end': '结束员工任职',
  'hr.employment.change_primary': '调岗并切换主任职',
  'item_master.item_model.list': '查看 ItemModel 列表',
  'item_master.item_model.get_by_id': '查看 ItemModel 详情',
  'item_master.item_model.create': '创建 ItemModel',
  'item_master.item_model.manage': '维护 ItemModel 基础信息、能力与分类',
  'item_master.item.list': '查看 Item 列表',
  'item_master.item.get_by_id': '查看 Item 详情',
  'item_master.item.create': '创建 Item',
  'item_master.item.update_basics': '更新 Item 基础信息',
  'item_master.item.update_status': '更新 Item 状态',
  'item_master.item.set_capabilities': '全量替换 Item 能力',
  'item_master.item.set_composition': '全量替换 Item 组成关系',
  'item_master.supplier_item_mapping.list_by_item': '查看 Item 的供应商型号映射',
  'item_master.supplier_item_mapping.upsert': '新增或更新供应商型号映射',
  'crm.account.read': '查看 CRM P1 客户关系账户',
  'crm.account.create': '创建 CRM P1 Lead 客户关系账户',
  'crm.account.update': '更新 CRM P1 客户关系账户',
  'crm.account.convert': '将 CRM P1 Lead 转为 Prospect Customer',
  'crm.account.claim': '认领 CRM P1 公海 Lead 或 Prospect Customer',
  'crm.account.release': '释放 CRM P1 Lead 或 Prospect Customer 回公海',
  'crm.account.manage': '管理 CRM P1 客户资源与公海例外动作',
  'crm.duplicate.viewRestricted': '查看 CRM 重复线索受限候选信息',
  'crm.contact.manage': '维护 CRM 联系人基础记录',
  'crm.source.manage': '维护 CRM 来源记录',
  'crm.activity.create': '创建 CRM 动态记录',
  'crm.opportunity.manage': '维护 CRM 商机基础记录',
  'crm.internal.object_reference.validate': '验证 Collaboration 引用的 CRM 对象最小事实',
  'srm.supplier_profile.list': '查看 SRM 供应商列表',
  'srm.supplier_profile.get_by_id': '查看 SRM 供应商详情',
  'srm.supplier_profile.create': '创建 SRM 供应商档案外壳',
  'srm.supplier_profile.update_basics': '更新 SRM 供应商基础信息',
  'srm.supplier_profile.bind_tenant_party': '绑定 SRM 供应商到租户主体',
  'srm.supplier_profile.change_status': '切换 SRM 供应商状态',
  'srm.supplier_contact.upsert': '新增或更新 SRM 供应商联系人',
  'srm.supplier_address.upsert': '新增或更新 SRM 供应商地址',
  'srm.supplier_offering.list_by_supplier': '查看供应商可供应 Item 列表',
  'srm.supplier_offering.list_by_item': '查看可供应指定 Item 的供应商列表',
  'srm.supplier_offering.upsert': '新增或更新供应商可供应关系',
  'srm.internal.supplier_profile.resolve_active': '解析可用于采购的 active 供应商',
  'srm.internal.supplier_offering.resolve_active': '解析可用于采购的 exact active 供应商可供应关系',
  'sales.quote.list': '查看报价列表',
  'sales.quote.get_by_id': '查看报价详情',
  'sales.quote.create': '创建报价草稿',
  'sales.quote.update_draft': '更新报价草稿',
  'sales.quote.publish': '正式发布报价版本',
  'sales.quote.convert_to_order': '将正式报价版本转为销售订单',
  'sales.order.list': '查看销售订单列表',
  'sales.order.get_by_id': '查看销售订单详情',
  'sales.order.set_commercial_gate': '设置销售订单商业放行结果',
  'sales.order.submit_fulfillment_handoff': '提交销售订单到履约边界的 handoff',
  'procurement.purchase_request.list': '查看采购申请列表',
  'procurement.purchase_request.get_by_id': '查看采购申请详情',
  'procurement.purchase_request.create': '创建采购申请草稿',
  'procurement.purchase_request.update_draft': '更新采购申请草稿',
  'procurement.purchase_request.submit': '提交采购申请',
  'procurement.purchase_request.decide': '审批或驳回采购申请',
  'procurement.purchase_request.cancel': '取消采购申请',
  'procurement.purchase_request.convert_to_order': '将已批准采购申请转为采购订单草稿',
  'procurement.purchase_order.list': '查看采购订单列表',
  'procurement.purchase_order.get_by_id': '查看采购订单详情',
  'procurement.purchase_order.create_draft': '创建采购订单草稿',
  'procurement.purchase_order.update_draft': '更新采购订单草稿',
  'procurement.purchase_order.issue': '正式发出采购订单',
  'procurement.purchase_order.confirm_acknowledgement': '记录供应商确认摘要',
  'procurement.purchase_order.apply_change': '应用采购订单变更并留下留痕',
  'procurement.purchase_order.cancel': '取消采购订单',
  'procurement.purchase_order_change.list': '查看采购订单变更留痕',
  'procurement.receiving_expectation.list': '查看收货预期列表',
  'procurement.receiving_expectation.get_by_id': '查看收货预期详情',
  'procurement.receiving_expectation.create': '创建收货预期',
  'procurement.receiving_discrepancy.record_resolution': '记录收货差异处理摘要',
  'procurement.internal.receiving_expectation.resolve_for_receipt':
    '为 WMS 收货引用解析最小 ReceivingExpectation 资格事实',
  'finance.financial_account.list': '查看资金账户列表',
  'finance.financial_account.get_by_id': '查看资金账户详情',
  'finance.financial_account.create': '创建资金账户',
  'finance.financial_account.update_basics': '更新资金账户基础信息',
  'finance.account_transaction.list': '查看账户流水列表',
  'finance.account_transaction.import': '批量导入账户流水',
  'finance.account_transaction.record': '手工登记账户流水',
  'finance.customer_financial_account.register': '登记客户付款账号',
  'finance.exchange_rate.get': '查看标准汇率',
  'finance.exchange_rate.set': '设置标准汇率',
  'finance.receivable_schedule.list': '查看应收计划列表',
  'finance.receivable_schedule.get_by_id': '查看应收计划详情',
  'finance.receivable_schedule.create_from_sales_order': '从销售订单建立应收计划',
  'finance.finance_release_signal.get': '查看财务放行信号',
  'finance.finance_release_signal.set': '设置财务放行信号',
  'finance.payment_allocation.list': '查看收款核销结果',
  'finance.payment_allocation.allocate_to_receivable': '将收款流水核销到应收计划',
  'auth.audit.list': '查看认证审计事件',
  'auth.account_credentials.bootstrap': '初始化账号登录凭据',
  'auth.account_login_methods.manage': '管理账号登录方式',
  'auth.mfa_policy.manage': '管理租户 MFA 策略',
  'auth.platform_mfa_policy.manage': '管理平台 MFA 策略',
  'auth.session.admin.view': '查看用户会话',
  'auth.session.admin.revoke': '撤销用户会话',
  'collaboration.task.assign': '指派协作任务给租户内其他账号',
  'terminal-device.enrollment.create': '创建受管终端设备 enrollment',
  'terminal-device.enrollment.revoke': '撤销未使用的受管终端设备 enrollment',
  'terminal-device.read': '查看受管终端设备列表与基础详情',
  'terminal-device.sensitive.read': '查看受管终端设备敏感诊断标识与运行详情',
  'terminal-device.status.disable': '禁用受管终端设备',
  'terminal-device.status.mark-lost': '标记受管终端设备丢失',
  'terminal-device.status.mark-maintenance': '标记受管终端设备维修中',
  'terminal-device.status.restore-active': '将受管终端设备恢复为可用状态',
  'terminal-device.version-policy.manage': '维护受管终端设备版本策略',
  'terminal-device.audit.read': '查看受管终端设备治理审计',
  'terminal-device.update': '更新受管终端设备展示字段',
  'terminal-device.internal.gateway.enrollment.activate': 'Gateway MACHINE 激活终端设备 enrollment',
  'terminal-device.internal.gateway.access.resolve': 'Gateway MACHINE 解析终端设备准入',
  'terminal-device.internal.gateway.heartbeat.record': 'Gateway MACHINE 写入终端设备 heartbeat',
  'terminal-device.internal.gateway.diagnostic_log.record': 'Gateway MACHINE 写入终端设备诊断日志'
} as const

const SYSTEM_ADMIN_ROLE = {
  id: '37e76049-6d90-456c-8ded-2cc42c60f001',
  code: 'system.admin',
  name: 'System Administrator',
  scopeKey: '__SYSTEM__'
} as const

// Extracts string values from permission-code constant records.
function valuesOf(record: Record<string, string>): string[] {
  return Object.values(record)
}

// Resolves the authoritative human-readable description for one permission seed code.
function getPermissionDescription(code: string): string | undefined {
  return PERMISSION_DESCRIPTION_BY_CODE[code]
}

// Builds the authoritative permission seed set from shared permission-code constants.
export function buildPermissionSeedItems(): PermissionSeedItem[] {
  return PERMISSION_CODE_SEED_ITEMS.map((item) => ({
    ...item,
    allowedScopeLevels: [...item.allowedScopeLevels]
  }))
}

/** filterRoleAssignablePermissionItems applies exact principal and optional scope eligibility to role sync. */
export function filterRoleAssignablePermissionItems(
  items: readonly PermissionSeedItem[],
  eligibility: {
    assignee: Extract<PermissionAssignee, 'HUMAN' | 'MACHINE'>
    scopeLevel?: PermissionScopeLevel
  }
): PermissionSeedItem[] {
  return items.filter(
    (item) =>
      item.kind === PermissionKind.BUSINESS &&
      item.assignableTo.includes(eligibility.assignee) &&
      (!eligibility.scopeLevel || item.allowedScopeLevels.includes(eligibility.scopeLevel))
  )
}

// Parses optional system admin account ids from environment variables used by local and deployment seeds.
function readSystemAdminAccountIds(): string[] {
  const raw =
    process.env.OES_SYSTEM_ADMIN_ACCOUNT_IDS ??
    process.env.SYSTEM_ADMIN_ACCOUNT_IDS ??
    process.env.OES_SYSTEM_ADMIN_ACCOUNT_ID ??
    process.env.SYSTEM_ADMIN_ACCOUNT_ID ??
    ''

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

// Upserts the system administrator role and synchronizes it with all current permission codes.
async function syncSystemAdminRole(
  prisma: PrismaClient,
  permissionIds: string[]
): Promise<{ roleId: string; permissionCount: number }> {
  const role = await prisma.role.upsert({
    where: {
      scopeKey_kind_code: {
        scopeKey: SYSTEM_ADMIN_ROLE.scopeKey,
        kind: RoleKind.SYSTEM_INSTANCE,
        code: SYSTEM_ADMIN_ROLE.code
      }
    },
    create: {
      id: SYSTEM_ADMIN_ROLE.id,
      tenantId: null,
      scopeKey: SYSTEM_ADMIN_ROLE.scopeKey,
      code: SYSTEM_ADMIN_ROLE.code,
      name: SYSTEM_ADMIN_ROLE.name,
      kind: RoleKind.SYSTEM_INSTANCE,
      templateRoleId: null,
      isEnabled: true,
      description: 'Built-in system administrator role for platform-level operators.'
    },
    update: {
      tenantId: null,
      scopeKey: SYSTEM_ADMIN_ROLE.scopeKey,
      name: SYSTEM_ADMIN_ROLE.name,
      kind: RoleKind.SYSTEM_INSTANCE,
      templateRoleId: null,
      isEnabled: true,
      description: 'Built-in system administrator role for platform-level operators.'
    }
  })

  await prisma.rolePermission.deleteMany({
    where: {
      roleId: role.id,
      permissionId: {
        notIn: permissionIds
      }
    }
  })

  if (permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId
      })),
      skipDuplicates: true
    })
  }

  return { roleId: role.id, permissionCount: permissionIds.length }
}

// Upserts built-in system role templates and synchronizes their baseline permissions by stable permission code.
async function syncBuiltInRoleTemplates(
  prisma: PrismaClient,
  permissionIdByCode: ReadonlyMap<string, string>
): Promise<number> {
  for (const template of BUILT_IN_ROLE_TEMPLATES) {
    const role = await prisma.role.upsert({
      where: {
        scopeKey_kind_code: {
          scopeKey: '__SYSTEM_TEMPLATE__',
          kind: RoleKind.SYSTEM_TEMPLATE,
          code: template.code
        }
      },
      create: {
        id: template.id,
        tenantId: null,
        scopeKey: '__SYSTEM_TEMPLATE__',
        code: template.code,
        name: template.name,
        kind: RoleKind.SYSTEM_TEMPLATE,
        templateRoleId: null,
        isEnabled: true,
        description: template.description
      },
      update: {
        tenantId: null,
        scopeKey: '__SYSTEM_TEMPLATE__',
        name: template.name,
        kind: RoleKind.SYSTEM_TEMPLATE,
        templateRoleId: null,
        isEnabled: true,
        description: template.description
      }
    })

    const permissionIds = template.permissionCodes
      .map((code) => permissionIdByCode.get(code))
      .filter((permissionId): permissionId is string => Boolean(permissionId))

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        ...(permissionIds.length > 0 ? { permissionId: { notIn: permissionIds } } : {})
      }
    })

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId
        })),
        skipDuplicates: true
      })
    }
  }

  return BUILT_IN_ROLE_TEMPLATES.length
}

// Binds the built-in system administrator role to configured system-scope user accounts.
async function syncSystemAdminAccountBindings(
  prisma: PrismaClient,
  roleId: string,
  accountIds: string[]
): Promise<number> {
  let bindingCount = 0

  for (const accountId of accountIds) {
    const existing = await prisma.principalRoleBinding.findFirst({
      where: {
        principalType: 'HUMAN',
        principalId: accountId,
        roleId,
        tenantId: null,
        scopeLevel: ScopeLevel.SYSTEM,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      }
    })
    if (!existing) {
      await prisma.principalRoleBinding.create({
        data: {
          principalType: 'HUMAN',
          principalId: accountId,
          roleId,
          tenantId: null,
          scopeLevel: ScopeLevel.SYSTEM,
          effectiveAt: new Date(),
          expiresAt: null,
          createdByOperatorId: 'permission-seed'
        }
      })
    }
    bindingCount += 1
  }

  return bindingCount
}

// Upserts built-in navigation entries and seeds missing baseline role navigation rows.
async function syncNavigationFoundation(prisma: PrismaClient): Promise<{
  deprecatedEntryCount: number
  entryCount: number
  landingSeedCount: number
  visibilitySeedCount: number
}> {
  for (const entry of DEFAULT_NAVIGATION_ENTRIES) {
    await prisma.navigationEntry.upsert({
      where: { entryKey: entry.entryKey },
      create: {
        entryKey: entry.entryKey,
        name: entry.name,
        description: entry.description,
        featureKey: entry.featureKey,
        supportedTerminals: entry.supportedTerminals,
        registryPriority: entry.registryPriority,
        enabled: entry.enabled,
        entryType: entry.entryType
      },
      update: {
        name: entry.name,
        description: entry.description,
        featureKey: entry.featureKey,
        supportedTerminals: entry.supportedTerminals,
        registryPriority: entry.registryPriority,
        enabled: entry.enabled,
        entryType: entry.entryType
      }
    })
  }

  let deprecatedEntryCount = 0
  if (DEPRECATED_NAVIGATION_ENTRY_KEYS.length > 0) {
    const disabledEntries = await prisma.navigationEntry.updateMany({
      where: {
        enabled: true,
        entryKey: {
          in: [...DEPRECATED_NAVIGATION_ENTRY_KEYS]
        }
      },
      data: {
        enabled: false
      }
    })
    await prisma.roleNavigationVisibility.updateMany({
      where: {
        enabled: true,
        entryKey: {
          in: [...DEPRECATED_NAVIGATION_ENTRY_KEYS]
        }
      },
      data: {
        enabled: false
      }
    })
    await prisma.roleLandingPolicy.updateMany({
      where: {
        enabled: true,
        defaultEntryKey: {
          in: [...DEPRECATED_NAVIGATION_ENTRY_KEYS]
        }
      },
      data: {
        enabled: false
      }
    })
    deprecatedEntryCount = disabledEntries.count
  }

  const roles = await prisma.role.findMany({
    where: {
      kind: {
        in: [RoleKind.SYSTEM_TEMPLATE, RoleKind.SYSTEM_INSTANCE, RoleKind.TENANT_INSTANCE]
      }
    },
    select: {
      id: true,
      code: true,
      kind: true
    }
  })

  const visibilitySeeds = buildNavigationFoundationVisibilitySeeds(roles)
  if (visibilitySeeds.length > 0) {
    await prisma.roleNavigationVisibility.createMany({
      data: visibilitySeeds,
      skipDuplicates: true
    })
  }

  const landingSeeds = buildNavigationFoundationLandingSeeds(roles)
  const existingLandingKeys = new Set(
    (
      await prisma.roleLandingPolicy.findMany({
        where: {
          roleId: { in: landingSeeds.map((seed) => seed.roleId) }
        },
        select: {
          roleId: true,
          terminal: true
        }
      })
    ).map((item) => `${item.roleId}:${item.terminal}`)
  )
  const missingLandingSeeds = landingSeeds.filter(
    (seed) => !existingLandingKeys.has(`${seed.roleId}:${seed.terminal}`)
  )

  if (missingLandingSeeds.length > 0) {
    await prisma.roleLandingPolicy.createMany({
      data: missingLandingSeeds,
      skipDuplicates: true
    })
  }

  return {
    deprecatedEntryCount,
    entryCount: DEFAULT_NAVIGATION_ENTRIES.length,
    visibilitySeedCount: visibilitySeeds.length,
    landingSeedCount: missingLandingSeeds.length
  }
}

// Synchronizes permission rows, the built-in system admin role, and optional system admin bindings.
async function main() {
  const prisma = new PrismaClient()

  try {
    const items = buildPermissionSeedItems()
    const humanRoleAssignableCodes = new Set(
      filterRoleAssignablePermissionItems(items, { assignee: 'HUMAN' }).map((item) => item.code)
    )
    const systemAdminAssignableCodes = new Set(
      filterRoleAssignablePermissionItems(items, {
        assignee: 'HUMAN',
        scopeLevel: PermissionScopeLevel.SYSTEM
      }).map((item) => item.code)
    )

    let upserted = 0
    const roleAssignablePermissionIdByCode = new Map<string, string>()
    const roleAssignablePermissionIds: string[] = []
    for (const item of items) {
      const permission = await prisma.permission.upsert({
        where: { code: item.code },
        create: {
          code: item.code,
          module: item.module,
          description: item.description,
          kind: item.kind,
          externalApiEligible: item.externalApiEligible,
          allowedScopeLevels: item.allowedScopeLevels,
          definitionFingerprint: item.definitionFingerprint
        },
        update: {
          module: item.module,
          description: item.description,
          kind: item.kind,
          externalApiEligible: item.externalApiEligible,
          allowedScopeLevels: item.allowedScopeLevels,
          definitionFingerprint: item.definitionFingerprint
        }
      })
      if (humanRoleAssignableCodes.has(item.code)) {
        roleAssignablePermissionIdByCode.set(permission.code, permission.id)
      }
      if (systemAdminAssignableCodes.has(item.code)) roleAssignablePermissionIds.push(permission.id)
      upserted += 1
    }

    const systemAdminRole = await syncSystemAdminRole(prisma, roleAssignablePermissionIds)
    const builtInRoleTemplateCount = await syncBuiltInRoleTemplates(
      prisma,
      roleAssignablePermissionIdByCode
    )
    const builtInRoleInstancePermissionBackfillCount = await syncBuiltInRoleInstanceBaselines(
      prisma,
      roleAssignablePermissionIdByCode
    )
    const systemAdminAccountIds = readSystemAdminAccountIds()
    const systemAdminBindingCount = await syncSystemAdminAccountBindings(
      prisma,
      systemAdminRole.roleId,
      systemAdminAccountIds
    )
    const navigationFoundation = await syncNavigationFoundation(prisma)

    process.stdout.write(
      [
        '=== Permission Foundation Sync ===',
        `seed_count=${items.length}`,
        `upserted_count=${upserted}`,
        `system_admin_role_id=${systemAdminRole.roleId}`,
        `system_admin_permission_count=${systemAdminRole.permissionCount}`,
        `built_in_role_template_count=${builtInRoleTemplateCount}`,
        `built_in_role_instance_permission_backfill_count=${builtInRoleInstancePermissionBackfillCount}`,
        `system_admin_binding_count=${systemAdminBindingCount}`,
        `navigation_entry_count=${navigationFoundation.entryCount}`,
        `navigation_deprecated_entry_disabled_count=${navigationFoundation.deprecatedEntryCount}`,
        `navigation_visibility_seed_count=${navigationFoundation.visibilitySeedCount}`,
        `navigation_landing_seed_count=${navigationFoundation.landingSeedCount}`
      ].join('\n') + '\n'
    )
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${String(error)}\n`)
    process.exitCode = 1
  })
}
