import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getPermissionCodeDefinition } from './catalog'

describe('Auth login owner-fact permission catalog and deployment profile', () => {
  const codes = [
    'hr.internal.auth_login_employee.resolve',
    'identity.internal.auth_login_account.resolve',
    'tenant_org.internal.auth_session_tenant_lifecycle.resolve'
  ]

  it.each(codes)('%s is SYSTEM WORKLOAD_POLICY-only and non-external', (code) => {
    expect(getPermissionCodeDefinition(code)).toEqual(
      expect.objectContaining({
        code,
        kind: 'INTERNAL',
        assignableTo: ['WORKLOAD_POLICY'],
        allowedScopeLevels: ['SYSTEM'],
        externalApiEligible: false
      })
    )
  })

  it('binds only exact Auth SPIFFE to the three exact target tuples without wildcard', () => {
    const profile = JSON.parse(
      readFileSync(
        join(
          __dirname,
          '../../../../../scripts/local/runtime-config/permission-auth-login-workload-policies.json'
        ),
        'utf8'
      )
    )
    expect(profile).toHaveLength(3)
    expect(profile.map((entry: any) => entry.permissionCodes[0]).sort()).toEqual(codes)
    for (const entry of profile) {
      expect(entry.originalWorkloadSpiffeId).toBe('spiffe://oes/auth-service')
      expect(entry.scopeLevel).toBe('SYSTEM')
      expect(entry.targetAudience).toMatch(/^urn:oes:service:(hr|identity|tenant-org)-service$/)
      expect(JSON.stringify(entry)).not.toContain('*')
      expect(entry).not.toHaveProperty('tenantIds')
      expect(entry).not.toHaveProperty('role')
      expect(entry).not.toHaveProperty('grant')
    }
  })
})
