import {
  AUTH_SELF_PERMISSION_CODES,
  CRM_MANAGEMENT_PERMISSION_CODES,
  FINANCE_MANAGEMENT_PERMISSION_CODES,
  HR_MANAGEMENT_PERMISSION_CODES,
  IDENTITY_ACCOUNT_PERMISSION_CODES,
  IDENTITY_ACCOUNT_SELF_PERMISSION_CODES,
  IDENTITY_MACHINE_PERMISSION_CODES,
  ITEM_MASTER_MANAGEMENT_PERMISSION_CODES,
  PERMISSION_ACCOUNT_SELF_PERMISSION_CODES,
  PROCUREMENT_MANAGEMENT_PERMISSION_CODES,
  PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES,
  PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES,
  ROLE_INSTANCE_PERMISSION_CODES,
  ROLE_TEMPLATE_PERMISSION_CODES,
  SALES_MANAGEMENT_PERMISSION_CODES,
  SALES_PRICING_PERMISSION_CODES,
  SRM_MANAGEMENT_PERMISSION_CODES,
  TENANT_ORG_MANAGEMENT_PERMISSION_CODES,
  DEPRECATED_PERMISSION_CODES,
  PERMISSION_CODE_SEED_ITEMS
} from '../../src/scripts/permission-catalog'
import { Modules } from '../../prisma/generated/prisma'

// Verifies the migrated permission catalog assigns every current code to its owner-service module.
describe('permission foundation seed', () => {
  it('publishes unique seed codes and excludes legacy coarse role permissions', () => {
    const seedItems = PERMISSION_CODE_SEED_ITEMS
    const seedCodes = seedItems.map((item) => item.code)

    expect(new Set(seedCodes).size).toBe(seedCodes.length)
    expect(seedCodes).not.toEqual(expect.arrayContaining([...DEPRECATED_PERMISSION_CODES]))
  })

  it('publishes owner-service modules for every migrated permission group', () => {
    const itemByCode = new Map(PERMISSION_CODE_SEED_ITEMS.map((item) => [item.code, item]))
    const groups: Array<[Modules, string[]]> = [
      [
        Modules.IDENTITY_SERVICE,
        [
          ...Object.values(IDENTITY_ACCOUNT_PERMISSION_CODES),
          ...Object.values(IDENTITY_ACCOUNT_SELF_PERMISSION_CODES),
          ...Object.values(IDENTITY_MACHINE_PERMISSION_CODES)
        ]
      ],
      [Modules.TENANT_ORG_SERVICE, Object.values(TENANT_ORG_MANAGEMENT_PERMISSION_CODES)],
      [Modules.HR_SERVICE, Object.values(HR_MANAGEMENT_PERMISSION_CODES)],
      [Modules.ITEM_MASTER_SERVICE, Object.values(ITEM_MASTER_MANAGEMENT_PERMISSION_CODES)],
      [Modules.CRM_SERVICE, Object.values(CRM_MANAGEMENT_PERMISSION_CODES)],
      [Modules.SRM_SERVICE, Object.values(SRM_MANAGEMENT_PERMISSION_CODES)],
      [
        Modules.SALES_SERVICE,
        [...Object.values(SALES_MANAGEMENT_PERMISSION_CODES), ...Object.values(SALES_PRICING_PERMISSION_CODES)]
      ],
      [Modules.PROCUREMENT_SERVICE, Object.values(PROCUREMENT_MANAGEMENT_PERMISSION_CODES)],
      [Modules.FINANCE_SERVICE, Object.values(FINANCE_MANAGEMENT_PERMISSION_CODES)],
      [
        Modules.PUBLIC_ENTRY_SERVICE,
        [
          ...Object.values(PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES),
          ...Object.values(PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES)
        ]
      ],
      [
        Modules.PERMISSION_SERVICE,
        [
          ...Object.values(ROLE_TEMPLATE_PERMISSION_CODES),
          ...Object.values(ROLE_INSTANCE_PERMISSION_CODES),
          ...Object.values(PERMISSION_ACCOUNT_SELF_PERMISSION_CODES)
        ]
      ],
      [Modules.AUTH_SERVICE, Object.values(AUTH_SELF_PERMISSION_CODES)]
    ]

    for (const [module, codes] of groups) {
      for (const code of codes) {
        expect(itemByCode.get(code)).toMatchObject({ module })
      }
    }
  })

  it('publishes item model permissions used by the item-management BFF', () => {
    const seedCodes = PERMISSION_CODE_SEED_ITEMS.map((item) => item.code)

    expect(seedCodes).toEqual(expect.arrayContaining([
      'item_master.item_model.list',
      'item_master.item_model.get_by_id',
      'item_master.item_model.create',
      'item_master.item_model.manage'
    ]))
  })

  it('publishes Public Entry permissions required by ShortLink and BusinessCard Phase 1', () => {
    const seedCodes = PERMISSION_CODE_SEED_ITEMS.map((item) => item.code)

    expect(seedCodes).toEqual(expect.arrayContaining([
      'public-entry.short-link.read',
      'public-entry.short-link.create',
      'public-entry.short-link.update',
      'public-entry.short-link.disable',
      'public-entry.short-link.archive',
      'public-entry.short-link.stats.read',
      'public-entry.business-card.read',
      'public-entry.business-card.manage',
      'public-entry.business-card.enable',
      'public-entry.business-card.disable',
      'public-entry.business-card.public-entry.manage',
      'public-entry.business-card.stats.read'
    ]))
  })
})
