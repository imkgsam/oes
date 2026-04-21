import { IDENTITY_ACCOUNT_PERMISSION_CODES } from '@oes/common/authorization'
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
  })
})
