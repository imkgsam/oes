import { resolveMesGrpcUrl, resolveTenantOrgGrpcUrl } from './app.module'

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
