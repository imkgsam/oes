import {
  HR_MANAGEMENT_PERMISSION_CODES,
  IDENTITY_ACCOUNT_PERMISSION_CODES,
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
})
