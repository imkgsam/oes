import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  bootstrapEnvironment,
  checkEnvironment,
  normalizeTaskKey,
  parseEnvironmentFile
} from './worktree-env.mjs'

const TEMPLATE = `OES_ENVIRONMENT=development
OES_TASK_KEY=auto
OES_POSTGRES_HOST=127.0.0.1
OES_POSTGRES_PORT=5432
OES_POSTGRES_USER=oes_local
OES_POSTGRES_PASSWORD=oes_local_only
OES_DATABASE_PREFIX=oes
`

/** Creates a minimal repository-shaped fixture with direct service-owned Prisma schemas. */
function createFixture(t, serviceCount = 2) {
  const repositoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-worktree-env-'))
  t.after(() => fs.rmSync(repositoryRoot, { force: true, recursive: true }))
  fs.writeFileSync(path.join(repositoryRoot, '.env.example'), TEMPLATE)
  for (let index = 1; index <= serviceCount; index += 1) {
    const serviceRoot = path.join(repositoryRoot, `src/services/system/service-${index}`)
    fs.mkdirSync(path.join(serviceRoot, 'prisma'), { recursive: true })
    fs.writeFileSync(
      path.join(serviceRoot, 'package.json'),
      JSON.stringify({ name: `service-${index}` })
    )
    fs.writeFileSync(path.join(serviceRoot, 'prisma/schema.prisma'), 'generator client {}\n')
  }
  return repositoryRoot
}

/** Adds a backend package without a datasource, matching the Gateway build shape. */
function addGatewayFixture(repositoryRoot) {
  const gatewayRoot = path.join(repositoryRoot, 'src/services/api-gateway')
  fs.mkdirSync(gatewayRoot, { recursive: true })
  fs.writeFileSync(path.join(gatewayRoot, 'package.json'), JSON.stringify({ name: 'api-gateway' }))
  return gatewayRoot
}

test('bootstrap creates isolated environments and check accepts an idempotent rerun', (t) => {
  const repositoryRoot = createFixture(t)
  const first = bootstrapEnvironment({
    expectedBackendCount: 2,
    expectedPrismaCount: 2,
    output: { write() {} },
    repositoryRoot,
    taskKey: 'fixture_a'
  })
  assert.equal(first.results.filter((entry) => entry.status === 'written').length, 3)

  const second = bootstrapEnvironment({
    expectedBackendCount: 2,
    expectedPrismaCount: 2,
    output: { write() {} },
    repositoryRoot,
    taskKey: 'fixture_a'
  })
  assert.equal(second.results.filter((entry) => entry.status === 'unchanged').length, 3)
  const checked = checkEnvironment({
    expectedBackendCount: 2,
    expectedPrismaCount: 2,
    output: { write() {} },
    repositoryRoot
  })
  assert.equal(checked.databases.size, 2)
  assert.equal(checked.taskKey, 'fixture_a')
})

test('bootstrap includes Gateway without assigning it a database', (t) => {
  const repositoryRoot = createFixture(t)
  const gatewayRoot = addGatewayFixture(repositoryRoot)
  const created = bootstrapEnvironment({
    expectedBackendCount: 3,
    expectedPrismaCount: 2,
    output: { write() {} },
    repositoryRoot,
    taskKey: 'fixture_gateway'
  })
  assert.equal(created.results.length, 4)
  const gatewayEnvironment = fs.readFileSync(path.join(gatewayRoot, '.env'), 'utf8')
  assert.match(gatewayEnvironment, /MODULE_NAME=api-gateway/)
  assert.doesNotMatch(gatewayEnvironment, /DATABASE_URL/)
  const checked = checkEnvironment({
    expectedBackendCount: 3,
    expectedPrismaCount: 2,
    output: { write() {} },
    repositoryRoot
  })
  assert.equal(checked.backendPackages.length, 3)
  assert.equal(checked.databases.size, 2)
})

test('bootstrap protects an existing user-managed environment', (t) => {
  const repositoryRoot = createFixture(t)
  fs.writeFileSync(path.join(repositoryRoot, '.env'), 'USER_MANAGED=true\n')
  assert.throws(
    () =>
      bootstrapEnvironment({
        expectedBackendCount: 2,
        expectedPrismaCount: 2,
        output: { write() {} },
        repositoryRoot,
        taskKey: 'fixture_b'
      }),
    /ENV_FILE_EXISTS/
  )
  assert.equal(fs.readFileSync(path.join(repositoryRoot, '.env'), 'utf8'), 'USER_MANAGED=true\n')
})

test('bootstrap preflights every service before writing any generated file', (t) => {
  const repositoryRoot = createFixture(t)
  const serviceEnvironment = path.join(repositoryRoot, 'src/services/system/service-2/.env')
  fs.writeFileSync(serviceEnvironment, 'USER_MANAGED=true\n')
  assert.throws(
    () =>
      bootstrapEnvironment({
        expectedBackendCount: 2,
        expectedPrismaCount: 2,
        output: { write() {} },
        repositoryRoot,
        taskKey: 'fixture_preflight'
      }),
    /ENV_FILE_EXISTS/
  )
  assert.equal(fs.existsSync(path.join(repositoryRoot, '.env')), false)
  assert.equal(
    fs.existsSync(path.join(repositoryRoot, 'src/services/system/service-1/.env')),
    false
  )
  assert.equal(fs.readFileSync(serviceEnvironment, 'utf8'), 'USER_MANAGED=true\n')
})

test('check rejects a placeholder and a production-like environment', (t) => {
  const repositoryRoot = createFixture(t)
  bootstrapEnvironment({
    expectedBackendCount: 2,
    expectedPrismaCount: 2,
    output: { write() {} },
    repositoryRoot,
    taskKey: 'fixture_c'
  })
  const rootPath = path.join(repositoryRoot, '.env')
  fs.writeFileSync(
    rootPath,
    fs
      .readFileSync(rootPath, 'utf8')
      .replace('OES_POSTGRES_PASSWORD=oes_local_only', 'OES_POSTGRES_PASSWORD=changeme')
  )
  assert.throws(
    () =>
      checkEnvironment({
        expectedBackendCount: 2,
        expectedPrismaCount: 2,
        output: { write() {} },
        repositoryRoot
      }),
    /ENV_ROOT_VALUE_INVALID/
  )

  bootstrapEnvironment({
    expectedBackendCount: 2,
    expectedPrismaCount: 2,
    force: true,
    output: { write() {} },
    repositoryRoot,
    taskKey: 'fixture_c'
  })
  const servicePath = path.join(repositoryRoot, 'src/services/system/service-1/.env')
  fs.writeFileSync(
    servicePath,
    fs.readFileSync(servicePath, 'utf8').replace('NODE_ENV=development', 'NODE_ENV=production')
  )
  assert.throws(
    () =>
      checkEnvironment({
        expectedBackendCount: 2,
        expectedPrismaCount: 2,
        output: { write() {} },
        repositoryRoot
      }),
    /ENV_SERVICE_UNSAFE_ENVIRONMENT/
  )
})

test('check rejects malformed, non-local, and non-task-owned database URLs', (t) => {
  const repositoryRoot = createFixture(t)
  bootstrapEnvironment({
    expectedBackendCount: 2,
    expectedPrismaCount: 2,
    output: { write() {} },
    repositoryRoot,
    taskKey: 'fixture_d'
  })
  const servicePath = path.join(repositoryRoot, 'src/services/system/service-1/.env')
  const original = fs.readFileSync(servicePath, 'utf8')

  fs.writeFileSync(servicePath, original.replace(/DATABASE_URL=.*/, 'DATABASE_URL="not a url"'))
  assert.throws(
    () =>
      checkEnvironment({
        expectedBackendCount: 2,
        expectedPrismaCount: 2,
        output: { write() {} },
        repositoryRoot
      }),
    /ENV_SERVICE_DATABASE_URL_MALFORMED/
  )
  fs.writeFileSync(servicePath, original.replace('127.0.0.1', 'database.example.test'))
  assert.throws(
    () =>
      checkEnvironment({
        expectedBackendCount: 2,
        expectedPrismaCount: 2,
        output: { write() {} },
        repositoryRoot
      }),
    /ENV_SERVICE_DATABASE_HOST_MISMATCH/
  )
  fs.writeFileSync(servicePath, original.replace(':5432/', ':55432/'))
  assert.throws(
    () =>
      checkEnvironment({
        expectedBackendCount: 2,
        expectedPrismaCount: 2,
        output: { write() {} },
        repositoryRoot
      }),
    /ENV_SERVICE_DATABASE_PORT_MISMATCH/
  )
  fs.writeFileSync(servicePath, original.replace('oes_local:', 'other_user:'))
  assert.throws(
    () =>
      checkEnvironment({
        expectedBackendCount: 2,
        expectedPrismaCount: 2,
        output: { write() {} },
        repositoryRoot
      }),
    /ENV_SERVICE_DATABASE_USER_MISMATCH/
  )
  fs.writeFileSync(servicePath, original.replace(':oes_local_only@', ':other_password@'))
  assert.throws(
    () =>
      checkEnvironment({
        expectedBackendCount: 2,
        expectedPrismaCount: 2,
        output: { write() {} },
        repositoryRoot
      }),
    /ENV_SERVICE_DATABASE_PASSWORD_MISMATCH/
  )
  fs.writeFileSync(servicePath, original.replace('/oes_fixture_d_service_1', '/shared_database'))
  assert.throws(
    () =>
      checkEnvironment({
        expectedBackendCount: 2,
        expectedPrismaCount: 2,
        output: { write() {} },
        repositoryRoot
      }),
    /ENV_SERVICE_DATABASE_NOT_TASK_OWNED/
  )
})

test('bootstrap and check fail closed on Prisma schema count drift', (t) => {
  const repositoryRoot = createFixture(t)
  const generatedSchema = path.join(
    repositoryRoot,
    'src/services/system/service-1/prisma/generated/prisma/schema.prisma'
  )
  fs.mkdirSync(path.dirname(generatedSchema), { recursive: true })
  fs.writeFileSync(generatedSchema, 'generator client {}\n')
  assert.equal(
    bootstrapEnvironment({
      expectedBackendCount: 2,
      expectedPrismaCount: 2,
      output: { write() {} },
      repositoryRoot,
      taskKey: 'fixture_generated_copy'
    }).services.length,
    2
  )
  assert.throws(
    () =>
      bootstrapEnvironment({
        expectedBackendCount: 2,
        expectedPrismaCount: 3,
        output: { write() {} },
        repositoryRoot,
        taskKey: 'fixture_e'
      }),
    /ENV_SERVICE_COUNT_MISMATCH expected=3 actual=2/
  )
})

test('environment parsing rejects duplicates and malformed quotes', () => {
  assert.throws(() => parseEnvironmentFile('KEY=one\nKEY=two\n'), /ENV_DUPLICATE_KEY/)
  assert.throws(() => parseEnvironmentFile('KEY="unterminated\n'), /ENV_UNTERMINATED_QUOTE/)
})

test('explicit task keys reject reserved, empty, and silently truncated forms', () => {
  assert.throws(() => normalizeTaskKey('auto'), /ENV_TASK_KEY_RESERVED/)
  assert.throws(() => normalizeTaskKey(''), /ENV_TASK_KEY_INVALID/)
  assert.throws(() => normalizeTaskKey('a'.repeat(41)), /ENV_TASK_KEY_INVALID/)
})

test('bootstrap rejects a symlink destination without changing its target', (t) => {
  const repositoryRoot = createFixture(t)
  const external = path.join(repositoryRoot, 'outside-env')
  fs.writeFileSync(external, 'EXTERNAL=true\n')
  fs.symlinkSync(external, path.join(repositoryRoot, '.env'))
  assert.throws(
    () =>
      bootstrapEnvironment({
        expectedBackendCount: 2,
        expectedPrismaCount: 2,
        output: { write() {} },
        repositoryRoot,
        taskKey: 'fixture_symlink'
      }),
    /ENV_FILE_SYMLINK/
  )
  assert.equal(fs.readFileSync(external, 'utf8'), 'EXTERNAL=true\n')
})
