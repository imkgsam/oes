import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildTenantWebAuthSeedEnvironment,
  resolveTenantWebAuthSeedDatabaseUrls,
  sanitizeTenantWebAuthSeedMessage,
  TENANT_WEB_AUTH_DATABASE_BINDINGS
} from '../tenant-web-auth-seed-environment.mjs'

const taskKey = 'fixture_task'
const serviceDatabases = Object.fromEntries(
  TENANT_WEB_AUTH_DATABASE_BINDINGS.map(({ service }) => [
    service,
    `oes_${taskKey}_${service.replace(/-service$/, '').replaceAll('-', '_')}`
  ])
)

function context() {
  return {
    repositoryRoot: '/tmp/oes-fixture',
    rootValues: new Map([
      ['OES_POSTGRES_HOST', '127.0.0.1'],
      ['OES_POSTGRES_USER', 'fixture_user'],
      ['OES_POSTGRES_PASSWORD', 'fixture_password']
    ]),
    services: Object.entries(serviceDatabases).map(([name, database]) => ({ name, database })),
    taskKey
  }
}

test('lifecycle builds all tenant-web seed URLs from the current task runtime port', () => {
  const environment = buildTenantWebAuthSeedEnvironment(context(), 49123, {
    KEEP_ME: 'preserved'
  })

  assert.equal(environment.KEEP_ME, 'preserved')
  assert.equal(environment.OES_TASK_KEY, taskKey)
  for (const { envKey, service } of TENANT_WEB_AUTH_DATABASE_BINDINGS) {
    const url = new URL(environment[envKey])
    assert.equal(url.hostname, '127.0.0.1')
    assert.equal(url.port, '49123')
    assert.equal(decodeURIComponent(url.pathname.slice(1)), serviceDatabases[service])
  }
})

test('seeder accepts one complete task-owned, loopback, single-port environment', () => {
  const environment = buildTenantWebAuthSeedEnvironment(context(), 49123)
  const resolved = resolveTenantWebAuthSeedDatabaseUrls(environment)

  assert.equal(resolved.size, TENANT_WEB_AUTH_DATABASE_BINDINGS.length)
  assert.equal(new Set([...resolved.values()].map((value) => new URL(value).port)).size, 1)
})

test('seeder rejects missing, foreign, mixed-port, and duplicate database bindings', () => {
  const valid = buildTenantWebAuthSeedEnvironment(context(), 49123)
  const first = TENANT_WEB_AUTH_DATABASE_BINDINGS[0]
  const second = TENANT_WEB_AUTH_DATABASE_BINDINGS[1]

  const missing = { ...valid }
  delete missing[first.envKey]
  assert.throws(() => resolveTenantWebAuthSeedDatabaseUrls(missing), /SEED_DATABASE_ENV_MISSING/)

  const foreign = {
    ...valid,
    [first.envKey]: 'postgresql://fixture:secret@db.example/oes_shared_auth'
  }
  assert.throws(() => resolveTenantWebAuthSeedDatabaseUrls(foreign), /SEED_DATABASE_HOST_NOT_LOCAL/)

  const mixedPort = {
    ...valid,
    [first.envKey]: valid[first.envKey].replace(':49123/', ':5432/')
  }
  assert.throws(
    () => resolveTenantWebAuthSeedDatabaseUrls(mixedPort),
    /SEED_DATABASE_RUNTIME_PORT_MISMATCH/
  )

  const duplicateBinding = JSON.parse(valid.OES_TENANT_WEB_AUTH_SEED_BINDING)
  duplicateBinding.databases[second.envKey] = duplicateBinding.databases[first.envKey]
  const duplicate = {
    ...valid,
    [second.envKey]: valid[first.envKey],
    OES_TENANT_WEB_AUTH_SEED_BINDING: JSON.stringify(duplicateBinding)
  }
  assert.throws(() => resolveTenantWebAuthSeedDatabaseUrls(duplicate), /SEED_DATABASE_DUPLICATE/)

  const wrongTask = {
    ...valid,
    [first.envKey]: valid[first.envKey].replace(`_${taskKey}_`, '_shared_')
  }
  assert.throws(
    () => resolveTenantWebAuthSeedDatabaseUrls(wrongTask),
    /SEED_DATABASE_NAME_MISMATCH/
  )
})

test('seeder rejects task-key-shaped foreign names and a uniformly wrong runtime port', () => {
  const valid = buildTenantWebAuthSeedEnvironment(context(), 49123)
  const foreignNames = { ...valid }
  for (const [index, { envKey }] of TENANT_WEB_AUTH_DATABASE_BINDINGS.entries()) {
    const url = new URL(foreignNames[envKey])
    url.pathname = `/foreign_${taskKey}_unrelated_${index}`
    foreignNames[envKey] = url.toString()
  }
  assert.throws(
    () => resolveTenantWebAuthSeedDatabaseUrls(foreignNames),
    /SEED_DATABASE_NAME_MISMATCH/
  )

  const wrongPort = { ...valid }
  for (const { envKey } of TENANT_WEB_AUTH_DATABASE_BINDINGS) {
    const url = new URL(wrongPort[envKey])
    url.port = '59999'
    wrongPort[envKey] = url.toString()
  }
  assert.throws(
    () => resolveTenantWebAuthSeedDatabaseUrls(wrongPort),
    /SEED_DATABASE_RUNTIME_PORT_MISMATCH/
  )
})

test('seeder error sanitization removes URLs and fixture credential values', () => {
  const message = sanitizeTenantWebAuthSeedMessage(
    'connect postgresql://fixture_user:fixture_password@127.0.0.1:49123/db password=fixture_password otp=123456 secret=totp-value',
    ['fixture_user', 'fixture_password', '123456', 'totp-value']
  )

  assert.doesNotMatch(message, /fixture_user|fixture_password|123456|totp-value|postgresql:\/\//)
  assert.match(message, /<TASK_DATABASE_URL>/)
  assert.match(message, /<REDACTED>/)
})

test('seeder error sanitization removes encoded and decoded credential forms', () => {
  const special = context()
  special.rootValues.set('OES_POSTGRES_USER', 'user@task:name')
  special.rootValues.set('OES_POSTGRES_PASSWORD', 'pass/task%value')
  const environment = buildTenantWebAuthSeedEnvironment(special, 49123)
  const url = new URL(environment.AUTH_DATABASE_URL)
  const message = sanitizeTenantWebAuthSeedMessage(
    `encoded=${url.username}/${url.password} decoded=user@task:name/pass/task%value`,
    [url.username, url.password]
  )

  assert.doesNotMatch(
    message,
    /user(?:%40|@)task|pass(?:%2F|\/)task|%3Aname|:name|%25value|%value/i
  )
})
