#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../..')
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const json = (relative) => JSON.parse(read(relative))

/** Walks only active runtime and service execution surfaces, excluding tests and generated output. */
function activeFiles() {
  const roots = ['package.json', '.github/workflows', 'scripts/local-runtime', 'scripts/test-infrastructure', 'scripts/local', 'src/services']
  const files = []
  const visit = (relative) => {
    const absolute = path.join(root, relative)
    const stat = fs.statSync(absolute)
    if (stat.isFile()) return files.push(relative)
    for (const name of fs.readdirSync(absolute)) {
      if (['node_modules', 'dist', 'coverage', '__tests__', 'test'].includes(name)) continue
      const child = path.join(relative, name)
      const childStat = fs.statSync(path.join(root, child))
      if (childStat.isDirectory() || /\.(?:mjs|cjs|js|ts|json|ya?ml|sh)$/u.test(name)) visit(child)
    }
  }
  for (const entry of roots) if (fs.existsSync(path.join(root, entry))) visit(entry)
  return files
    .filter((file) => !/\.spec\.[cm]?[jt]s$/u.test(file))
    .filter((file) => file !== 'scripts/local-runtime/test/static.check.mjs')
}

const removed = [
  'docker-compose.yml',
  'docker-compose.infra.yml',
  'scripts/local/database-lifecycle.mjs',
  'scripts/local/worktree-env.mjs',
  'scripts/local/trusted-runtime.mjs',
  'scripts/local/trusted-runtime-dev-service.mjs',
  'scripts/local/trusted-runtime-issuer.mjs',
  'scripts/local/backend-start-preflight.mjs'
]
for (const relative of removed) assert.equal(fs.existsSync(path.join(root, relative)), false, `legacy runtime file remains: ${relative}`)

const sources = activeFiles().map((file) => ({ file, text: read(file) }))
for (const { file, text } of sources) {
  assert.doesNotMatch(text, /docker-compose(?:\.infra)?\.yml|COMPOSE_PROJECT_NAME|\.tmp\/oes-database-lifecycle|worktree-env\.mjs/u, `legacy runtime reference: ${file}`)
  assert.doesNotMatch(text, /prisma\s+(?:db\s+)?push|--accept-data-loss/u, `schema push authority remains: ${file}`)
}

const rootPackage = json('package.json')
for (const [name, command] of Object.entries(rootPackage.scripts)) {
  if (name.startsWith('local:trusted-runtime:')) assert.match(command, /(?:runtime:|scripts\/local-runtime\/launcher\.mjs)/u, `compatibility script does not delegate: ${name}`)
}
assert.equal(rootPackage.scripts['test:database-lifecycle'], undefined)
assert.equal(rootPackage.scripts['local-runtime:check'], 'pnpm local-runtime:test && pnpm local-runtime:static')

for (const area of ['system', 'business']) {
  for (const owner of fs.readdirSync(path.join(root, 'src/services', area))) {
    const packagePath = path.join('src/services', area, owner, 'package.json')
    if (!fs.existsSync(path.join(root, packagePath))) continue
    const pkg = json(packagePath)
    assert.equal(pkg.scripts?.['prisma:push'], undefined, `${owner} retains prisma:push`)
    if (pkg.scripts?.['test:integration']) assert.equal(pkg.scripts['test:integration'], `pnpm --workspace-root test:run -- --type integration --owner ${pkg.name}`)
    assert.equal(fs.existsSync(path.join(root, 'src/services', area, owner, '.env.example')), false, `${owner} retains an unmanaged dotenv example`)
  }
}

const workflow = read('.github/workflows/ci.yml')
assert.match(workflow, /max-parallel:\s*2/u)
assert.match(workflow, /concurrency:\s*\n/u)
assert.match(workflow, /label=oes\.runtime\.task-key=/u)
assert.doesNotMatch(workflow, /docker compose|docker-compose/u)

const driver = read('scripts/local-runtime/src/docker-driver.mjs')
assert.match(driver, /127\.0\.0\.1::\$\{port\}/u)
assert.doesNotMatch(driver, /--publish['"],\s*['"](?:127\.0\.0\.1:)?\d+:/u)
assert.equal(driver.match(/mc alias set -- local/gu)?.length, 3, 'every MinIO alias must terminate option parsing')
assert.equal(driver.match(/mc admin user add -- local/gu)?.length, 1, 'MinIO user creation must terminate option parsing')
assert.doesNotMatch(driver, /mc alias set local|mc admin user add local/u, 'MinIO secrets must not be parsed as CLI flags')
const processRuntime = read('scripts/local-runtime/src/process-runtime.mjs')
for (const binding of ['AUTH_EXECUTION_SIGNER_SOCKET_PATH', 'AUTH_EXECUTION_KMS_KEY_REF', 'AUTH_HTTP_PORT', 'GATEWAY_READINESS_TARGETS', 'issuer-server.mjs']) assert.match(processRuntime, new RegExp(binding, 'u'))
assert.match(read('scripts/local-runtime/src/bootstrap.mjs'), /prisma['"],\s*['"]migrate['"],\s*['"]deploy/u)

process.stdout.write(`LOCAL_RUNTIME_STATIC_OK files=${sources.length} services=${Object.keys(json('scripts/local-runtime/relationships.json').owners).length}\n`)
