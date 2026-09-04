import { RoleModule } from '../modules/role/role.module'
import { SYMBOLS } from '../common/constants/symbols'

describe('RoleModule provider registration', () => {
  it('provides terminal access repository for role template inheritance handlers', () => {
    const providers = Reflect.getMetadata('providers', RoleModule) ?? []

    expect(providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provide: SYMBOLS.REPO.TERMINAL_ACCESS
        })
      ])
    )
  })
})
