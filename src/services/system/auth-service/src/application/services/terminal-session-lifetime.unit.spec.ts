import { resolveTerminalSessionLifetime } from './terminal-session-lifetime'

describe('resolveTerminalSessionLifetime', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('uses env overrides for PDA token lifetime during local integration testing', () => {
    process.env.PDA_ACCESS_TOKEN_VALIDITY_SEC = '45'
    process.env.PDA_REFRESH_TOKEN_VALIDITY_SEC = '180'

    expect(resolveTerminalSessionLifetime('PDA', undefined)).toEqual({
      accessTokenValidity: 45,
      refreshTokenValidity: 180
    })
  })

  it('keeps the production PDA defaults when env overrides are missing or invalid', () => {
    process.env.PDA_ACCESS_TOKEN_VALIDITY_SEC = '0'
    process.env.PDA_REFRESH_TOKEN_VALIDITY_SEC = 'not-a-number'

    expect(resolveTerminalSessionLifetime('PDA', undefined)).toEqual({
      accessTokenValidity: 900,
      refreshTokenValidity: 1200
    })
  })

  it('still uses the shared token config for web sessions', () => {
    process.env.PDA_ACCESS_TOKEN_VALIDITY_SEC = '45'
    process.env.PDA_REFRESH_TOKEN_VALIDITY_SEC = '180'

    expect(
      resolveTerminalSessionLifetime('WEB', {
        accessTokenValidity: 300,
        refreshTokenValidity: 3600
      })
    ).toEqual({
      accessTokenValidity: 300,
      refreshTokenValidity: 3600
    })
  })
})
