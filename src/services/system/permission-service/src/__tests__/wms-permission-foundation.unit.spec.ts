import { PERMISSION_CODE_SEED_ITEMS, WMS_MANAGEMENT_PERMISSION_CODES } from '../scripts/permission-catalog'
import {
  DEFAULT_NAVIGATION_ENTRIES,
  buildNavigationFoundationVisibilitySeeds
} from '../scripts/navigation-foundation'

// Verifies the permission foundation exposes the minimum WMS action codes while keeping business navigation out of tenant admin.
describe('WMS permission foundation', () => {
  it('registers the minimum WMS permission seed items', () => {
    const items = PERMISSION_CODE_SEED_ITEMS
    const codes = items.map((item) => item.code)

    expect(codes).toEqual(
      expect.arrayContaining([
        WMS_MANAGEMENT_PERMISSION_CODES.READ_WAREHOUSE,
        WMS_MANAGEMENT_PERMISSION_CODES.READ_LOCATION,
        WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT,
        WMS_MANAGEMENT_PERMISSION_CODES.MANAGE_RECEIPT,
        WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY
      ])
    )
  })

  it('publishes a tenant-web WMS navigation entry without granting tenant admins visibility', () => {
    expect(
      DEFAULT_NAVIGATION_ENTRIES.find((entry) => entry.entryKey === 'wms.management')
    ).toMatchObject({
      entryKey: 'wms.management',
      featureKey: 'wms',
      name: 'WMS 管理'
    })

    const rows = buildNavigationFoundationVisibilitySeeds([
      {
        code: 'tenant.admin',
        id: 'role-1',
        kind: 'TENANT_INSTANCE' as any
      }
    ])

    expect(rows).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          enabled: true,
          entryKey: 'wms.management',
          roleId: 'role-1'
        })
      ])
    )
  })
})
