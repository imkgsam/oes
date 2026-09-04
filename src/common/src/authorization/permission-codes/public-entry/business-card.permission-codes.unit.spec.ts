import {
  PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES,
  PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_DEFINITIONS
} from './business-card.permission-codes'

describe('Public Entry BusinessCard Permission definitions', () => {
  it('admits only public read at SYSTEM scope for the exact Gateway MACHINE contract', () => {
    const permissions = PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_DEFINITIONS.permissions

    expect(permissions[PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.READ]).toMatchObject({
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT']
    })
    for (const code of [
      PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.MANAGE,
      PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.ENABLE,
      PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.DISABLE,
      PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.PUBLIC_ENTRY_MANAGE,
      PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.STATS_READ
    ]) {
      expect(permissions[code].allowedScopeLevels).toEqual(['TENANT'])
    }
  })
})
