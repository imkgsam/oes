import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const workspaceRoot = resolve(__dirname, '../../../../../')
const read = (path: string) => readFileSync(resolve(workspaceRoot, path), 'utf8')

/** Extracts one stable set of dynamically applied frozen handler names from source. */
function applied(source: string, helper: string): string[] {
  return [...source.matchAll(new RegExp(`^${helper}\\(\\s*'([^']+)'`, 'gm'))].map(
    (match) => match[1]
  )
}

/** Locks the five-service atomic group to 217 one-mode admissions and the exact new INTERNAL vocabulary. */
describe('foundation atomic trusted gRPC declarations', () => {
  it('covers the exact 217-member arithmetic without dual declarations', () => {
    const auth = applied(
      read('src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts'),
      'applyAuthAdmission'
    )
    const identityQueries = applied(
      read(
        'src/services/system/identity-service/src/interfaces/grpc/identity-query.grpc.controller.ts'
      ),
      'applyIdentityQueryDeclaration'
    )
    const identityManagement = applied(
      read(
        'src/services/system/identity-service/src/interfaces/grpc/identity-management.grpc.controller.ts'
      ),
      'applyIdentityManagementDeclaration'
    )
    const hr = [
      ...applied(
        read('src/services/system/hr-service/src/interfaces/grpc/hr-management.grpc.controller.ts'),
        'applyHrDeclaration'
      ),
      ...applied(
        read('src/services/system/hr-service/src/interfaces/grpc/hr-query.grpc.controller.ts'),
        'applyHrDeclaration'
      )
    ]
    const tenantOrg = [
      ...applied(
        read(
          'src/services/system/tenant-org-service/src/interfaces/grpc/tenant-org-management.grpc.controller.ts'
        ),
        'applyTenantOrgDeclaration'
      ),
      ...applied(
        read(
          'src/services/system/tenant-org-service/src/interfaces/grpc/tenant-org-query.grpc.controller.ts'
        ),
        'applyTenantOrgDeclaration'
      )
    ]
    expect([
      auth.length,
      identityQueries.length,
      identityManagement.length,
      hr.length,
      tenantOrg.length
    ]).toEqual([70, 18, 24, 15, 20])
    for (const methods of [auth, identityQueries, identityManagement, hr, tenantOrg])
      expect(new Set(methods).size).toBe(methods.length)
    const identityBaselineManagement = identityManagement.filter(
      (method) =>
        !['enrollMachineWorkloadBinding', 'disableMachineWorkloadBinding'].includes(method)
    )
    const atomicTotal =
      auth.length +
      4 +
      (identityQueries.length + identityBaselineManagement.length + 1 + 1) +
      66 +
      hr.length +
      tenantOrg.length
    expect(atomicTotal).toBe(217)
  })

  it('registers exactly the six frozen Permission transport Codes', () => {
    const generated = read(
      'src/common/src/authorization/permission-codes/permission/internal.permission-codes.ts'
    )
    const codes = [...generated.matchAll(/'permission\.internal\.[a-z0-9_.]+'/g)].map((match) =>
      match[0].slice(1, -1)
    )
    expect(
      codes.filter(
        (code) =>
          !code.includes('principal_authorization') && !code.includes('delegated_authorization')
      )
    ).toEqual([
      'permission.internal.permission.check',
      'permission.internal.account_terminal_access.resolve',
      'permission.internal.resource.check',
      'permission.internal.query_scope.build',
      'permission.internal.account_access_summary.resolve',
      'permission.internal.account_navigation.resolve'
    ])
  })
})
