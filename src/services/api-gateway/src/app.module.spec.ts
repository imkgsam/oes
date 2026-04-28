import { resolveTenantOrgGrpcUrl } from './app.module'

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
