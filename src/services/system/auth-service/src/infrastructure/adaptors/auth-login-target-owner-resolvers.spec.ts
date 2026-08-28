import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Auth HR and TenantOrg login owner resolver transport', () => {
  it('uses only the dedicated target INTERNAL methods and Codes', () => {
    const hr = readFileSync(join(__dirname, 'hr-service.adaptor.ts'), 'utf8')
    const tenant = readFileSync(join(__dirname, 'tenant-org-lifecycle.grpc.adaptor.ts'), 'utf8')
    expect(hr).toContain('resolveAuthLoginEmployee(')
    expect(hr).toContain("'hr.internal.auth_login_employee.resolve'")
    expect(hr).not.toContain('forBusinessCall')
    expect(hr).not.toContain('hr.employee.get_by_id')
    expect(tenant).toContain('resolveAuthSessionTenantLifecycle(')
    expect(tenant).toContain("'tenant_org.internal.auth_session_tenant_lifecycle.resolve'")
    expect(tenant).not.toContain('forBusinessCall')
    expect(tenant).not.toContain('tenant_org.tenant.get_by_id')
  })
})
