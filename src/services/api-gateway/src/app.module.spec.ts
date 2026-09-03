import {
  GATEWAY_REQUEST_LOGGER_ROUTE,
  permissionGrpcProtoPaths,
  resolveAuthGrpcUrl,
  resolveHrGrpcUrl,
  resolveMesGrpcUrl,
  resolveTenantOrgGrpcUrl,
  resolveTerminalDeviceGrpcUrl
} from './app.module'
import { GATEWAY_GLOBAL_PREFIX_EXCLUDES } from './config/gateway-global-prefix'

describe('permissionGrpcProtoPaths', () => {
  it('loads terminal access proto so auth-bff can resolve account terminal eligibility', () => {
    expect(permissionGrpcProtoPaths).toContainEqual(
      expect.stringContaining('permission_terminal_access.proto')
    )
  })
})

describe('GATEWAY_GLOBAL_PREFIX_EXCLUDES', () => {
  it('keeps the public ShortLink redirect at the root edge path', () => {
    expect(GATEWAY_GLOBAL_PREFIX_EXCLUDES).toContain('c/:shortCode')
  })
})

describe('GATEWAY_REQUEST_LOGGER_ROUTE', () => {
  it('uses the named path-to-regexp wildcard required by Nest 11', () => {
    expect(GATEWAY_REQUEST_LOGGER_ROUTE).toBe('{*requestPath}')
  })
})

describe('resolveAuthGrpcUrl', () => {
  const originalHost = process.env.AUTH_SERVICE_HOST
  const originalPort = process.env.AUTH_SERVICE_PORT
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    if (originalHost === undefined) {
      delete process.env.AUTH_SERVICE_HOST
    } else {
      process.env.AUTH_SERVICE_HOST = originalHost
    }

    if (originalPort === undefined) {
      delete process.env.AUTH_SERVICE_PORT
    } else {
      process.env.AUTH_SERVICE_PORT = originalPort
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = originalNodeEnv
    }
  })

  it('normalizes localhost to the IPv4 loopback endpoint', () => {
    process.env.NODE_ENV = 'development'
    process.env.AUTH_SERVICE_HOST = 'localhost'
    process.env.AUTH_SERVICE_PORT = '50050'

    expect(resolveAuthGrpcUrl()).toBe('127.0.0.1:50050')
  })

  it('uses the explicit auth endpoint when a non-localhost host and port are provided', () => {
    process.env.AUTH_SERVICE_HOST = '10.0.0.50'
    process.env.AUTH_SERVICE_PORT = '56050'

    expect(resolveAuthGrpcUrl()).toBe('10.0.0.50:56050')
  })
})

describe('resolveTenantOrgGrpcUrl', () => {
  const originalHost = process.env.TENANT_ORG_SERVICE_HOST
  const originalPort = process.env.TENANT_ORG_SERVICE_PORT

  afterEach(() => {
    if (originalHost === undefined) {
      delete process.env.TENANT_ORG_SERVICE_HOST
    } else {
      process.env.TENANT_ORG_SERVICE_HOST = originalHost
    }

    if (originalPort === undefined) {
      delete process.env.TENANT_ORG_SERVICE_PORT
    } else {
      process.env.TENANT_ORG_SERVICE_PORT = originalPort
    }
  })

  it('uses the explicit tenant-org endpoint when host and port are provided', () => {
    process.env.TENANT_ORG_SERVICE_HOST = '10.0.0.9'
    process.env.TENANT_ORG_SERVICE_PORT = '56054'

    expect(resolveTenantOrgGrpcUrl()).toBe('10.0.0.9:56054')
  })

  it('falls back to the IPv4 loopback endpoint for local development', () => {
    delete process.env.TENANT_ORG_SERVICE_HOST
    delete process.env.TENANT_ORG_SERVICE_PORT

    expect(resolveTenantOrgGrpcUrl()).toBe('127.0.0.1:50054')
  })
})

describe('resolveHrGrpcUrl', () => {
  const originalHost = process.env.HR_SERVICE_HOST
  const originalPort = process.env.HR_SERVICE_PORT
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    if (originalHost === undefined) {
      delete process.env.HR_SERVICE_HOST
    } else {
      process.env.HR_SERVICE_HOST = originalHost
    }

    if (originalPort === undefined) {
      delete process.env.HR_SERVICE_PORT
    } else {
      process.env.HR_SERVICE_PORT = originalPort
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = originalNodeEnv
    }
  })

  it('falls back to the IPv4 loopback endpoint for local HR calls', () => {
    delete process.env.HR_SERVICE_HOST
    delete process.env.HR_SERVICE_PORT
    process.env.NODE_ENV = 'development'

    expect(resolveHrGrpcUrl()).toBe('127.0.0.1:50055')
  })

  it('normalizes localhost to the IPv4 loopback endpoint', () => {
    process.env.HR_SERVICE_HOST = 'localhost'
    process.env.HR_SERVICE_PORT = '50055'

    expect(resolveHrGrpcUrl()).toBe('127.0.0.1:50055')
  })
})

describe('resolveTerminalDeviceGrpcUrl', () => {
  const originalHost = process.env.TERMINAL_DEVICE_SERVICE_HOST
  const originalPort = process.env.TERMINAL_DEVICE_SERVICE_PORT

  afterEach(() => {
    if (originalHost === undefined) {
      delete process.env.TERMINAL_DEVICE_SERVICE_HOST
    } else {
      process.env.TERMINAL_DEVICE_SERVICE_HOST = originalHost
    }

    if (originalPort === undefined) {
      delete process.env.TERMINAL_DEVICE_SERVICE_PORT
    } else {
      process.env.TERMINAL_DEVICE_SERVICE_PORT = originalPort
    }
  })

  it('normalizes localhost to the IPv4 terminal-device endpoint', () => {
    process.env.TERMINAL_DEVICE_SERVICE_HOST = 'localhost'
    process.env.TERMINAL_DEVICE_SERVICE_PORT = '50057'

    expect(resolveTerminalDeviceGrpcUrl()).toBe('127.0.0.1:50057')
  })

  it('falls back to the local terminal-device endpoint used by the BFF', () => {
    delete process.env.TERMINAL_DEVICE_SERVICE_HOST
    delete process.env.TERMINAL_DEVICE_SERVICE_PORT

    expect(resolveTerminalDeviceGrpcUrl()).toBe('127.0.0.1:50057')
  })
})

describe('resolveMesGrpcUrl', () => {
  const originalHost = process.env.MES_SERVICE_HOST
  const originalPort = process.env.MES_SERVICE_PORT

  afterEach(() => {
    if (originalHost === undefined) {
      delete process.env.MES_SERVICE_HOST
    } else {
      process.env.MES_SERVICE_HOST = originalHost
    }

    if (originalPort === undefined) {
      delete process.env.MES_SERVICE_PORT
    } else {
      process.env.MES_SERVICE_PORT = originalPort
    }
  })

  it('uses the explicit MES endpoint when host and port are provided', () => {
    process.env.MES_SERVICE_HOST = '10.0.0.65'
    process.env.MES_SERVICE_PORT = '56065'

    expect(resolveMesGrpcUrl()).toBe('10.0.0.65:56065')
  })

  it('falls back to the local MES gRPC endpoint', () => {
    delete process.env.MES_SERVICE_HOST
    delete process.env.MES_SERVICE_PORT

    expect(resolveMesGrpcUrl()).toBe('localhost:50065')
  })
})
