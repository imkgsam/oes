import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('PrincipalRoleBinding persistence contract', () => {
  const serviceRoot = resolve(__dirname, '../..')
  const schema = readFileSync(resolve(serviceRoot, 'prisma/schema.prisma'), 'utf8')
  const migrationPath = resolve(
    serviceRoot,
    'prisma/migrations/20260729_principal_role_binding/migration.sql'
  )

  it('models canonical immutable grant and first-revoke audit facts', () => {
    expect(schema).toContain('model PrincipalRoleBinding {')
    expect(schema).toMatch(/principalType\s+PrincipalType/)
    expect(schema).toContain('principalId')
    expect(schema).toContain('revokedAt')
    expect(schema).toContain('revokedByOperatorId')
    expect(schema).toContain('revokeAuditEventId')
    expect(schema).not.toContain('@@unique([accountId, roleId])')
  })

  it('migrates legacy IDs without regranting and enforces scope/window invariants in PostgreSQL', () => {
    const sql = readFileSync(migrationPath, 'utf8')

    expect(sql).toContain('RENAME TO "PrincipalRoleBinding"')
    expect(sql).toContain('RENAME COLUMN "accountId" TO "principalId"')
    expect(sql).toContain('SET "principalType" = \'HUMAN\'')
    expect(sql).toContain('PrincipalRoleBinding backfill parity failed')
    expect(sql).toContain('PrincipalRoleBindingMigrationAudit')
    expect(sql).toContain('PrincipalRoleBindingRevokeTombstone')
    expect(sql).toContain('principal_role_binding_scope_tenant_check')
    expect(sql).toContain('principal_role_binding_time_window_check')
    expect(sql).toContain('EXCLUDE USING gist')
    expect(sql).toContain('tsrange')
  })
})
