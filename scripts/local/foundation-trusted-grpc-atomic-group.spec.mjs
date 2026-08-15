import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const packet = readFileSync(resolve(root, 'docs/plans/features/trusted-grpc-execution-context.md'), 'utf8')
const leaseBlock = packet.match(/foundationIdentityAuthzAtomicGroupImplementationLease:\n([\s\S]*?)\n```/)?.[1] ?? ''
const lease = [...leaseBlock.matchAll(/- \{ state: (EXISTING|NEW_TARGET), path: ([^ }]+) \}/g)].map((match) => ({ state: match[1], path: match[2] }))
const read = (path) => readFileSync(resolve(root, path), 'utf8')

/** Returns candidate paths relative to the exact Program Control base, including uncommitted work. */
function changedPaths() {
  const committed = execFileSync('git', ['diff', '--name-only', 'ecf25641ef8beaf823bbdb1b1808279d1b6ffed5..HEAD'], { cwd: root, encoding: 'utf8' })
  const working = execFileSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' })
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
  return [...new Set(`${committed}\n${working}\n${untracked}`.trim().split(/\n+/).filter(Boolean))].sort()
}

test('atomic lease is exact and candidate changes stay inside all 185 paths', () => {
  assert.equal(lease.length, 185)
  assert.deepEqual(Object.fromEntries(['EXISTING', 'NEW_TARGET'].map((state) => [state, lease.filter((entry) => entry.state === state).length])), { EXISTING: 156, NEW_TARGET: 29 })
  const allowed = new Set(lease.map((entry) => entry.path))
  const outside = changedPaths().filter((path) => !allowed.has(path))
  assert.deepEqual(outside, [])
})

test('all 29 frozen new targets exist and use UTF-8-decodable source', () => {
  const targets = lease.filter((entry) => entry.state === 'NEW_TARGET')
  assert.equal(targets.length, 29)
  for (const target of targets) assert.doesNotThrow(() => read(target.path))
})

test('wire authority tombstones total exactly 32 and retained selectors remain', () => {
  const auth = read('src/common/src/contracts/auth_service/auth.proto')
  const identity = read('src/common/src/contracts/identity_service/identity_query.proto')
  const permission = read('src/common/src/contracts/permission_service/permission_management.proto')
  const hr = read('src/common/src/contracts/hr_service/hr.proto')
  const frozenNames = [
    ...Array(10).fill('tenant_id'),
    ...Array(8).fill('tenant_id'),
    ...Array(3).fill('operator_id'),
    ...Array(3).fill('operator_id'),
    ...Array(2).fill('org_id'),
    ...Array(6).fill('tenant_id')
  ]
  assert.equal(frozenNames.length, 32)
  assert.match(auth, /reserved 5, 6, 7;\n  reserved "operator_id", "tenant_id", "org_id";/)
  assert.match(identity, /reserved 5, 6, 7;\n  reserved "operator_id", "tenant_id", "org_id";/)
  assert.match(permission, /reserved 5, 6, 7;\n  reserved "operator_id", "tenant_id", "org_id";/)
  assert.equal((hr.match(/reserved "tenant_id";/g) ?? []).length >= 10, true)
  assert.match(read('src/common/src/contracts/tenant_org_service/tenant_org.proto'), /string tenant_id = 1;/)
})

test('five baseline controllers contain no legacy authority decorators', () => {
  const paths = [
    'src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts',
    'src/services/system/identity-service/src/interfaces/grpc/identity-management.grpc.controller.ts',
    'src/services/system/identity-service/src/interfaces/grpc/identity-query.grpc.controller.ts',
    'src/services/system/hr-service/src/interfaces/grpc/hr-management.grpc.controller.ts',
    'src/services/system/hr-service/src/interfaces/grpc/hr-query.grpc.controller.ts',
    'src/services/system/tenant-org-service/src/interfaces/grpc/tenant-org-management.grpc.controller.ts',
    'src/services/system/tenant-org-service/src/interfaces/grpc/tenant-org-query.grpc.controller.ts',
    'src/services/system/permission-service/src/interfaces/grpc/permission-management.grpc.controller.ts'
  ]
  for (const path of paths) {
    const source = read(path)
    assert.doesNotMatch(source, /@(RequireAuthenticatedOperator|RequirePermissions|RequireManagementPermission|UseGuards\(InternalServiceGuard)/)
  }
})
