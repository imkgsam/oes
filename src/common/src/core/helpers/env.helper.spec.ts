describe('env helper', () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = originalNodeEnv
    }
    jest.resetModules()
  })

  it('treats an unset NODE_ENV as local development', () => {
    delete process.env.NODE_ENV
    jest.resetModules()

    const { envConfig, isDevelopment } = require('./env.helper') as {
      envConfig: { logLevel: string }
      isDevelopment: () => boolean
    }

    expect(isDevelopment()).toBe(true)
    expect(envConfig.logLevel).toBe('debug')
  })

  it('keeps production distinct from local development', () => {
    process.env.NODE_ENV = 'production'
    jest.resetModules()

    const { envConfig, isDevelopment } = require('./env.helper') as {
      envConfig: { logLevel: string }
      isDevelopment: () => boolean
    }

    expect(isDevelopment()).toBe(false)
    expect(envConfig.logLevel).toBe('info')
  })
})
