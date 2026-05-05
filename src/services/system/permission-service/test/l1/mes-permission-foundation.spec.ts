import {
  MES_MANAGEMENT_PERMISSION_CODES,
  PERMISSION_CODE_SEED_ITEMS
} from '../../src/scripts/permission-catalog'
import {
  DEFAULT_NAVIGATION_ENTRIES,
  buildNavigationFoundationVisibilitySeeds
} from '../../src/scripts/navigation-foundation'
import { BUILT_IN_ROLE_TEMPLATES } from '../../src/scripts/role-foundation'

// Verifies the permission foundation exposes the minimum MES mold loop role, action codes, and navigation entry.
describe('MES permission foundation', () => {
  it('registers the minimum MES mold management permission seed items', () => {
    const codes = PERMISSION_CODE_SEED_ITEMS.map((item) => item.code)

    expect(codes).toEqual(
      expect.arrayContaining([
        MES_MANAGEMENT_PERMISSION_CODES.READ_MANUFACTURING_SPEC,
        MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MANUFACTURING_SPEC,
        MES_MANAGEMENT_PERMISSION_CODES.READ_MOLD_DESIGN,
        MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MOLD_DESIGN,
        MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD_INSTANCE,
        MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE,
        MES_MANAGEMENT_PERMISSION_CODES.READ_WORK_CENTER_MOLD_STATUS,
        MES_MANAGEMENT_PERMISSION_CODES.RECORD_MOLD_USAGE,
        MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MOLD_LIFE
      ])
    )
  })

  it('publishes the forming workshop supervisor role template with the MES mold loop permissions', () => {
    expect(BUILT_IN_ROLE_TEMPLATES).toContainEqual(
      expect.objectContaining({
        code: 'mes.forming_workshop.supervisor',
        name: '成型车间主管',
        permissionCodes: [
          MES_MANAGEMENT_PERMISSION_CODES.READ_MANUFACTURING_SPEC,
          MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MANUFACTURING_SPEC,
          MES_MANAGEMENT_PERMISSION_CODES.READ_MOLD_DESIGN,
          MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MOLD_DESIGN,
          MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD_INSTANCE,
          MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE,
          MES_MANAGEMENT_PERMISSION_CODES.READ_WORK_CENTER_MOLD_STATUS,
          MES_MANAGEMENT_PERMISSION_CODES.RECORD_MOLD_USAGE,
          MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MOLD_LIFE
        ]
      })
    )
  })

  it('publishes MES navigation only for the forming workshop supervisor role template', () => {
    expect(
      DEFAULT_NAVIGATION_ENTRIES.find((entry) => entry.entryKey === 'mes.mold-management')
    ).toMatchObject({
      entryKey: 'mes.mold-management',
      featureKey: 'mes',
      name: '模具管理'
    })

    const rows = buildNavigationFoundationVisibilitySeeds([
      {
        code: 'tenant.admin',
        id: 'role-tenant-admin',
        kind: 'TENANT_INSTANCE' as any
      },
      {
        code: 'mes.forming_workshop.supervisor',
        id: 'role-mes-supervisor',
        kind: 'TENANT_INSTANCE' as any
      }
    ])

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          enabled: true,
          entryKey: 'mes.mold-management',
          roleId: 'role-mes-supervisor'
        })
      ])
    )
    expect(rows).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          enabled: true,
          entryKey: 'mes.mold-management',
          roleId: 'role-tenant-admin'
        })
      ])
    )
  })
})
