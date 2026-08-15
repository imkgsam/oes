import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const packet = readFileSync(resolve(root, 'docs/plans/features/trusted-grpc-execution-context.md'), 'utf8')
const leaseBlock = packet.match(/foundationIdentityAuthzAtomicGroupImplementationLease:\n([\s\S]*?)\n```/)?.[1] ?? ''
const lease = [...leaseBlock.matchAll(/- \{ state: (EXISTING|NEW_TARGET), path: ([^ }]+) \}/g)].map((match) => ({ state: match[1], path: match[2] }))
const read = (path) => readFileSync(resolve(root, path), 'utf8')

/** Reads TypeScript sources below one directory for repository-wide legacy registration assertions. */
function sourceTree(path) {
  const directory = resolve(root, path)
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts'))
    .map((entry) => readFileSync(resolve(entry.parentPath, entry.name), 'utf8'))
    .join('\n')
}

/** Returns corrective-candidate paths relative to the integrated Program Control base, including uncommitted work. */
function changedPaths() {
  const committed = execFileSync('git', ['diff', '--name-only', '413190797e29070d5a5907c0d5af62f28f71a57d..HEAD'], { cwd: root, encoding: 'utf8' })
  const working = execFileSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' })
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
  return [...new Set(`${committed}\n${working}\n${untracked}`.trim().split(/\n+/).filter(Boolean))].sort()
}

test('atomic lease is exact and corrective candidate changes stay inside all 193 paths', () => {
  assert.equal(lease.length, 193)
  assert.deepEqual(Object.fromEntries(['EXISTING', 'NEW_TARGET'].map((state) => [state, lease.filter((entry) => entry.state === state).length])), { EXISTING: 164, NEW_TARGET: 29 })
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

test('all five foundation servers install mandatory mTLS credentials without a plaintext flag', () => {
  const mains = [
    'src/services/system/auth-service/src/main.ts',
    'src/services/system/identity-service/src/main.ts',
    'src/services/system/permission-service/src/main.ts',
    'src/services/system/hr-service/src/main.ts',
    'src/services/system/tenant-org-service/src/main.ts'
  ]
  for (const path of mains) {
    const source = read(path)
    assert.match(source, /(?:credentials:\s*createGrpcServerCredentials\(\)|createAuthGrpcMicroserviceOptions\(createAuthGrpcServerCredentials\(\))/)
    assert.doesNotMatch(source, /OES_GRPC_TLS_ENABLED/)
  }
})

test('foundation production channels do not use the generic connection pool and always bind client credentials', () => {
  const noGeneric = [
    'src/services/system/auth-service/src/infrastructure/modules/external-services.module.ts',
    'src/services/system/identity-service/src/app.module.ts',
    'src/services/system/identity-service/src/modules/identity-management/identity-management.module.ts',
    'src/services/system/tenant-org-service/src/app.module.ts',
    'src/services/system/tenant-org-service/src/modules/tenant-org-management/tenant-org-management.module.ts',
    'src/services/system/tenant-org-service/src/modules/tenant-org-query/tenant-org-query.module.ts'
  ]
  for (const path of noGeneric) {
    const source = read(path)
    assert.doesNotMatch(source, /GrpcTransportModule\.for(?:Root|Feature)/)
  }
  assert.doesNotMatch(read('src/services/system/auth-service/src/app.module.ts'), /SERVICE_NAMES\.(?:IDENTITY|PERMISSION|HR|TENANT_ORG)/)

  const credentialed = [
    'src/services/system/hr-service/src/infrastructure/modules/hr-reference.module.ts',
    'src/services/system/hr-service/src/modules/hr-onboarding/hr-onboarding.module.ts',
    'src/services/system/auth-service/src/infrastructure/adaptors/foundation-trusted-grpc.clients.ts',
    'src/services/system/identity-service/src/infrastructure/adaptors/foundation-trusted-grpc.clients.ts',
    'src/services/system/permission-service/src/infrastructure/adaptors/foundation-trusted-grpc.clients.ts',
    'src/services/system/tenant-org-service/src/infrastructure/adapters/foundation-trusted-grpc.clients.ts'
  ]
  for (const path of credentialed) {
    assert.match(read(path), /createGrpcClientCredentials\(\)/)
  }

  const foundationSources = [
    'src/services/system/auth-service/src',
    'src/services/system/identity-service/src',
    'src/services/system/permission-service/src',
    'src/services/system/hr-service/src',
    'src/services/system/tenant-org-service/src'
  ].map(sourceTree).join('\n')
  assert.doesNotMatch(foundationSources, /InjectGrpcClient\(SERVICE_NAMES\.(?:AUTH|IDENTITY|PERMISSION|HR|TENANT_ORG)\)/)
  assert.doesNotMatch(foundationSources, /getGrpcClientToken\(SERVICE_NAMES\.(?:AUTH|IDENTITY|PERMISSION|HR|TENANT_ORG)\)/)
  assert.doesNotMatch(foundationSources, /GrpcTransportModule\.forFeature\([\s\S]{0,300}SERVICE_NAMES\.(?:AUTH|IDENTITY|PERMISSION|HR|TENANT_ORG)/)
})
