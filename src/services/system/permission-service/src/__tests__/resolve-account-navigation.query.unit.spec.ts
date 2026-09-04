import { validateSync } from 'class-validator'
import { ResolveAccountNavigationQuery } from '../application/queries/access-summary/resolve-account-navigation.query'
import { ScopeLevel } from '../domain/enums/scope-level.enum'

describe('ResolveAccountNavigationQuery', () => {
  it('allows system-scope navigation requests without tenant id', () => {
    const query = new ResolveAccountNavigationQuery(
      'account-system',
      undefined,
      ScopeLevel.SYSTEM,
      'WEB'
    )

    expect(validateSync(query)).toEqual([])
  })
})
