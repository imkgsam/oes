#!/usr/bin/env node
import { chmod, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { statSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { createConnection } from 'node:net'
import { randomBytes } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import process from 'node:process'

const root = resolve(import.meta.dirname, '../..')
const taskKey = process.env.OES_TASK_KEY?.trim() || 'tmp_31d7ce4d'
const stateRoot = resolve(process.env.OES_TRUSTED_RUNTIME_STATE || join(root, '.tmp/oes-trusted-runtime', taskKey))
const trustRoot = join(stateRoot, 'trust')
const envSource = resolve(process.env.OES_TASK_ENV || join(root, '.tmp/oes-database-lifecycle', taskKey, 'compose.env'))
const inventoryPath = join(root, 'docker/grpc-trust/workloads.txt')
const command = process.argv[2] || 'check'

/** Reads the frozen listener inventory and rejects duplicate identities, ports, and sources. */
export async function readInventory(text) {
  text ??= await readFile(inventoryPath, 'utf8')
  const entries = text.split(/\r?\n/u).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')).map((line) => {
    const [workload, port, source] = line.split('|')
    return { workload, canonicalPort: port === '-' ? null : Number(port), source }
  })
  const listeners = entries.filter((entry) => entry.canonicalPort !== null)
  for (const key of ['workload', 'canonicalPort', 'source']) {
    const values = listeners.map((entry) => entry[key]).filter((value) => value !== null)
    if (new Set(values).size !== values.length) throw new Error(`TRUSTED_RUNTIME_DUPLICATE_${key.toUpperCase()}`)
  }
  return listeners
}

/** Creates one deterministic, task-owned host profile without embedding credential values in its manifest. */
export async function generateProfile({ basePort = Number(process.env.OES_TRUSTED_RUNTIME_BASE_PORT || 52050), requireInfrastructure = false } = {}) {
  const inventory = await readInventory()
  const sourceEnvironment = parseEnv(await readFile(envSource, 'utf8'))
  const nacosPort = process.env.OES_NACOS_HOST_PORT?.trim() || sourceEnvironment.NACOS_HOST_PORT || (requireInfrastructure ? resolveInfrastructurePort('nacos', '8848') : '8848')
  const postgresPort = requireInfrastructure ? resolveInfrastructurePort('postgres', '5432') : '5432'
  const redisPort = requireInfrastructure ? resolveInfrastructurePort('redis', '6379') : '6379'
  const natsPort = requireInfrastructure ? resolveInfrastructurePort('nats', '4222') : '4222'
  const minioPort = requireInfrastructure ? resolveInfrastructurePort('minio', '9000') : '9000'
  const composeEnvironment = requireInfrastructure ? renderComposeEnvironment() : {}
  await mkdir(join(stateRoot, 'env'), { recursive: true, mode: 0o700 })
  await mkdir(join(stateRoot, 'logs'), { recursive: true, mode: 0o700 })
  await mkdir(join(stateRoot, 'pids'), { recursive: true, mode: 0o700 })
  await mkdir(join(stateRoot, 'secrets'), { recursive: true, mode: 0o700 })
  const notificationPayloadKey = await stableBase64Secret(join(stateRoot, 'secrets/notification-delivery-payload.key'), 32)
  const endpoints = Object.fromEntries(inventory.map((entry, index) => [entry.workload, basePort + index]))
  const manifest = { version: 1, taskKey, stateRoot, trustRoot, nacos: `127.0.0.1:${nacosPort}`, services: [] }
  for (const entry of inventory) {
    const packageDirectory = resolve(root, entry.source.split('/src/')[0])
    const packageJson = JSON.parse(await readFile(join(packageDirectory, 'package.json'), 'utf8'))
    const env = { ...sourceEnvironment, ...(composeEnvironment[entry.workload] || {}) }
    Object.assign(env, endpointEnvironment(endpoints))
    Object.assign(env, {
      MODULE_NAME: entry.workload,
      GRPC_LISTEN_HOST: '127.0.0.1',
      GRPC_LISTEN_PORT: String(endpoints[entry.workload]),
      SERVICE_REGISTRY_IP: '127.0.0.1',
      SERVICE_REGISTRY_PORT: String(endpoints[entry.workload]),
      NACOS_SERVER: `127.0.0.1:${nacosPort}`,
      OES_GRPC_TLS_ENABLED: 'true',
      OES_GRPC_TLS_MIN_VERSION: 'TLSv1.2',
      OES_GRPC_TLS_CA_PATH: join(trustRoot, entry.workload, 'current/ca.pem'),
      OES_GRPC_TLS_CERT_PATH: join(trustRoot, entry.workload, 'current/cert.pem'),
      OES_GRPC_TLS_KEY_PATH: join(trustRoot, entry.workload, 'current/key.pem'),
      OES_WORKLOAD_SPIFFE_ID: `spiffe://local.oes.internal/ns/oes/sa/${entry.workload}`,
      DATABASE_URL: rewriteDatabaseUrl(sourceEnvironment[`OES_DB_${entry.workload.replaceAll('-', '_').toUpperCase()}_URL`] || env.DATABASE_URL || '', postgresPort),
      REDIS_HOST: env.REDIS_HOST ? '127.0.0.1' : '',
      REDIS_PORT: env.REDIS_PORT ? redisPort : '',
      NATS_URL: env.NATS_URL ? `nats://127.0.0.1:${natsPort}` : '',
      ASSET_S3_ENDPOINT: env.ASSET_S3_ENDPOINT ? `http://127.0.0.1:${minioPort}` : ''
    })
    if (entry.workload === 'notification-service') env.NOTIFICATION_DELIVERY_PAYLOAD_KEY = notificationPayloadKey
    const envPath = join(stateRoot, 'env', `${entry.workload}.env`)
    await writeFile(envPath, Object.entries(env).filter(([, value]) => value !== '').sort().map(([key, value]) => `${key}=${shellQuote(value)}`).join('\n') + '\n', { mode: 0o600 })
    await chmod(envPath, 0o600)
    manifest.services.push({ workload: entry.workload, packageName: packageJson.name, packageDirectory, port: endpoints[entry.workload], group: serviceGroup(entry.workload), serverName: `${entry.workload}.localhost`, spiffeId: env.OES_WORKLOAD_SPIFFE_ID, envPath, certPath: env.OES_GRPC_TLS_CERT_PATH, logPath: join(stateRoot, 'logs', `${entry.workload}.log`), pidPath: join(stateRoot, 'pids', `${entry.workload}.pid`) })
  }
  await writeFile(join(stateRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { mode: 0o600 })
  await chmod(join(stateRoot, 'manifest.json'), 0o600)
  return manifest
}

/** Starts exact built package entrypoints and records only task-owned PIDs/logs. */
async function up() {
  await spawnChecked(join(root, 'docker/grpc-trust/bootstrap-local-trust.sh'), ['--output', trustRoot], { OES_TRUST_OUTPUT_DIRECTORY: trustRoot })
  const manifest = await generateProfile({ requireInfrastructure: true })
  await startSigner(manifest)
  await spawnChecked('pnpm', ['proto:gen'])
  await spawnChecked('pnpm', ['prisma:generate:all'])
  await spawnChecked('pnpm', ['common:build'])
  for (const group of [...new Set(manifest.services.map((service) => service.group))].sort()) {
    const services = manifest.services.filter((service) => service.group === group)
    for (const service of services) await startService(service)
    await waitReady(services, 90_000)
  }
  await status(true)
}

async function startSigner(manifest) {
  const signer = { pidPath: join(stateRoot, 'pids/signer.pid'), logPath: join(stateRoot, 'logs/signer.log') }
  // macOS limits Unix-domain socket paths to 104 bytes, so signer state uses a
  // short task-owned root rather than the deeper generated profile directory.
  const work = join('/private/tmp', `oes-signer-${taskKey}`)
  const ready = join(work, 'ready')
  const socket = join(work, 'signer.sock')
  if (await livePid(signer.pidPath)) {
    const keyReference = (await readFile(ready, 'utf8')).trim()
    await appendEnvironment(manifest.services.find((service) => service.workload === 'auth-service').envPath, { AUTH_EXECUTION_SIGNER_SOCKET_PATH: socket, AUTH_EXECUTION_KMS_KEY_REF: keyReference })
    return
  }
  await mkdir(work, { recursive: true, mode: 0o700 })
  const module = await ensureTaskLocalSoftHsm()
  if (!module) return startDockerSigner(manifest, work, ready, socket)
  spawnSync('docker', ['stop', `oes_${taskKey}-execution-token-signer-1`], { encoding: 'utf8', timeout: 15_000 })
  const child = spawn(join(root, 'docker/grpc-trust/execution-token-signer/local/softhsm2/run-host.sh'), [], { cwd: root, env: { ...process.env, EXECUTION_SIGNER_RUNTIME_MODE: '1', EXECUTION_SIGNER_HOST_WORK_DIR: work, EXECUTION_SIGNER_KEEP_HOST_WORK_DIR: '1', EXECUTION_SIGNER_READY_PATH: ready, AUTH_EXECUTION_SIGNER_SOCKET_PATH: socket, AUTH_EXECUTION_PKCS11_MODULE: module }, detached: true, stdio: ['ignore', await openAppend(signer.logPath), await openAppend(signer.logPath)] })
  child.unref(); await writeFile(signer.pidPath, `${child.pid}\n`, { mode: 0o600 })
  for (let attempt = 0; attempt < 60; attempt += 1) { try { const keyReference = (await readFile(ready, 'utf8')).trim(); await appendEnvironment(manifest.services.find((service) => service.workload === 'auth-service').envPath, { AUTH_EXECUTION_SIGNER_SOCKET_PATH: socket, AUTH_EXECUTION_KMS_KEY_REF: keyReference }); return } catch { await new Promise((resolvePromise) => setTimeout(resolvePromise, 500)) } }
  throw new Error('TRUSTED_RUNTIME_SIGNER_NOT_READY')
}

async function startDockerSigner(manifest, work, ready, socket) {
  const override = join(stateRoot, 'signer.compose.yml')
  const uid = process.getuid?.() ?? 65532
  const gid = process.getgid?.() ?? 65532
  await writeFile(override, `services:\n  execution-token-signer:\n    user: "${uid}:${gid}"\n    volumes:\n      - type: bind\n        source: ${JSON.stringify(work)}\n        target: /execution-signer\n`, { mode: 0o600 })
  await chmod(override, 0o600)
  const existing = spawnSync('docker', ['inspect', '-f', '{{.State.Running}}', `oes_${taskKey}-execution-token-signer-1`], { encoding: 'utf8', timeout: 5_000 })
  if (existing.status === 0 && existing.stdout.trim() === 'true') {
    try { const keyReference = (await readFile(ready, 'utf8')).trim(); await appendEnvironment(manifest.services.find((service) => service.workload === 'auth-service').envPath, { AUTH_EXECUTION_SIGNER_SOCKET_PATH: socket, AUTH_EXECUTION_KMS_KEY_REF: keyReference }); return } catch { /* Recreate an unhealthy or incomplete signer below. */ }
  }
  await spawnChecked('docker', ['compose', '--env-file', envSource, '-p', `oes_${taskKey}`, '-f', join(root, 'docker-compose.yml'), '-f', override, 'up', '-d', '--build', '--no-deps', 'execution-token-signer'])
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { const keyReference = (await readFile(ready, 'utf8')).trim(); await appendEnvironment(manifest.services.find((service) => service.workload === 'auth-service').envPath, { AUTH_EXECUTION_SIGNER_SOCKET_PATH: socket, AUTH_EXECUTION_KMS_KEY_REF: keyReference }); return } catch { await new Promise((resolvePromise) => setTimeout(resolvePromise, 500)) }
  }
  throw new Error('TRUSTED_RUNTIME_DOCKER_SIGNER_NOT_READY')
}

function hostSoftHsmModule() {
  for (const path of [join(stateRoot, 'softhsm/softhsm/2.7.0/lib/softhsm/libsofthsm2.so'), '/opt/homebrew/lib/softhsm/libsofthsm2.so', '/usr/local/lib/softhsm/libsofthsm2.so', '/usr/lib/softhsm/libsofthsm2.so', '/usr/lib/x86_64-linux-gnu/softhsm/libsofthsm2.so']) {
    try { if (statSync(path).isFile()) return path } catch { /* Docker signer is the bounded fallback. */ }
  }
  return null
}

async function ensureTaskLocalSoftHsm() {
  const existing = hostSoftHsmModule()
  if (existing) {
    const bytes = await readFile(existing)
    if (bytes.includes(Buffer.from('@@HOMEBREW_PREFIX@@'))) {
      await spawnChecked('install_name_tool', ['-change', '@@HOMEBREW_PREFIX@@/opt/openssl@3/lib/libcrypto.3.dylib', '/opt/homebrew/opt/openssl@3/lib/libcrypto.3.dylib', existing])
      await spawnChecked('codesign', ['--force', '--sign', '-', existing])
    }
    return existing
  }
  if (process.platform !== 'darwin' || spawnSync('brew', ['--version'], { timeout: 5_000 }).status !== 0) return null
  await spawnChecked('brew', ['fetch', 'softhsm'])
  const cache = spawnSync('brew', ['--cache', 'softhsm'], { encoding: 'utf8', timeout: 5_000 })
  if (cache.status !== 0) return null
  const destination = join(stateRoot, 'softhsm')
  await mkdir(destination, { recursive: true, mode: 0o700 })
  await spawnChecked('tar', ['-xzf', cache.stdout.trim(), '-C', destination])
  return ensureTaskLocalSoftHsm()
}

async function startService(service) {
  if (await livePid(service.pidPath)) return
  try { await stat(join(service.packageDirectory, 'dist/main.js')) } catch { await spawnChecked('pnpm', ['--filter', service.packageName, 'build']) }
  const environment = parseEnv(await readFile(service.envPath, 'utf8'))
  const out = await openAppend(service.logPath)
  const child = spawn('pnpm', ['--filter', service.packageName, 'start'], { cwd: root, env: { ...process.env, ...environment }, detached: true, stdio: ['ignore', out, out] })
  child.unref(); await writeFile(service.pidPath, `${child.pid}\n`, { mode: 0o600 })
}

async function waitReady(services, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if ((await Promise.all(services.map((service) => canConnect('127.0.0.1', service.port)))).every(Boolean)) return
    if ((await Promise.all(services.map((service) => livePid(service.pidPath)))).some((pid) => !pid)) throw new Error('TRUSTED_RUNTIME_PROCESS_EXITED')
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500))
  }
  throw new Error(`TRUSTED_RUNTIME_READINESS_TIMEOUT_${services.map((service) => service.workload).join('_')}`)
}

/** Reports PID and listener state without substituting a different process. */
async function status(requireReady = false) {
  const manifest = JSON.parse(await readFile(join(stateRoot, 'manifest.json'), 'utf8'))
  let failed = false
  for (const service of manifest.services) {
    const pid = await livePid(service.pidPath)
    const reachable = await canConnect('127.0.0.1', service.port)
    process.stdout.write(`${service.workload} pid=${pid || 'DOWN'} port=${service.port} reachable=${reachable}\n`)
    failed ||= !pid || !reachable
  }
  if (requireReady && failed) throw new Error('TRUSTED_RUNTIME_NOT_READY')
}

/** Stops only PIDs whose command line still belongs to the recorded package. */
async function down() {
  const manifest = JSON.parse(await readFile(join(stateRoot, 'manifest.json'), 'utf8'))
  for (const service of [...manifest.services].reverse()) {
    const pid = await livePid(service.pidPath)
    if (pid) process.kill(pid, 'SIGTERM')
    await rm(service.pidPath, { force: true })
  }
  const signerPid = await livePid(join(stateRoot, 'pids/signer.pid'))
  if (signerPid) process.kill(signerPid, 'SIGTERM')
  await rm(join(stateRoot, 'pids/signer.pid'), { force: true })
  if (!hostSoftHsmModule()) await spawnChecked('docker', ['compose', '--env-file', envSource, '-p', `oes_${taskKey}`, '-f', join(root, 'docker-compose.yml'), '-f', join(stateRoot, 'signer.compose.yml'), 'stop', 'execution-token-signer'])
}

function serviceGroup(workload) {
  if (['party-service', 'permission-service', 'identity-service', 'tenant-org-service', 'hr-service'].includes(workload)) return 1
  if (workload === 'auth-service') return 2
  if (['asset-service', 'item-master-service', 'terminal-device-service'].includes(workload)) return 3
  if (['crm-service', 'srm-service', 'sales-service', 'procurement-service', 'finance-service', 'wms-service', 'mes-service'].includes(workload)) return 4
  return 5
}

async function appendEnvironment(path, additions) {
  const values = { ...parseEnv(await readFile(path, 'utf8')), ...additions }
  await writeFile(path, Object.entries(values).sort().map(([key, value]) => `${key}=${shellQuote(value)}`).join('\n') + '\n', { mode: 0o600 })
  await chmod(path, 0o600)
}

function endpointEnvironment(endpoints) {
  const result = {}
  for (const [workload, port] of Object.entries(endpoints)) {
    const stem = workload.replace(/-service$/u, '').replaceAll('-', '_').toUpperCase()
    const url = `${workload}.localhost:${port}`
    result[`GRPC_SERVICE_${stem}_URL`] = url
    result[`${stem}_GRPC_URL`] = url
    result[`${stem}_SERVICE_GRPC_URL`] = url
    result[`${stem}_SERVICE_HOST`] = `${workload}.localhost`
    result[`${stem}_SERVICE_PORT`] = String(port)
  }
  return result
}

/** Reads only the exact task-project infrastructure mapping and rejects ambiguous or missing ports. */
function resolveInfrastructurePort(service, containerPort) {
  const container = `oes_${taskKey}-${service}-1`
  const result = spawnSync('docker', ['port', container, `${containerPort}/tcp`], { encoding: 'utf8', timeout: 5_000 })
  if (result.status !== 0) throw new Error(`TRUSTED_RUNTIME_INFRA_PORT_UNAVAILABLE_${service.toUpperCase()}`)
  const match = result.stdout.trim().match(/:(\d+)$/u)
  if (!match) throw new Error(`TRUSTED_RUNTIME_INFRA_PORT_INVALID_${service.toUpperCase()}`)
  return match[1]
}

function renderComposeEnvironment() {
  const result = spawnSync('docker', ['compose', '--env-file', envSource, '-p', `oes_${taskKey}`, '-f', join(root, 'docker-compose.yml'), 'config', '--format', 'json'], { encoding: 'utf8', timeout: 15_000, maxBuffer: 16 * 1024 * 1024 })
  if (result.status !== 0) throw new Error('TRUSTED_RUNTIME_COMPOSE_PROFILE_INVALID')
  const services = JSON.parse(result.stdout).services
  return Object.fromEntries(Object.entries(services).map(([name, service]) => [name, service.environment || {}]))
}

function rewriteDatabaseUrl(value, hostPort) {
  if (!value) return ''
  const url = new URL(value)
  url.hostname = '127.0.0.1'; url.port = hostPort
  return url.toString()
}

/** Persists one task-owned opaque secret and reuses it for this isolated runtime. */
async function stableBase64Secret(path, byteLength) {
  try {
    const existing = (await readFile(path, 'utf8')).trim()
    if (Buffer.from(existing, 'base64').length === byteLength) return existing
  } catch { /* Create the absent task-owned secret below. */ }
  const value = randomBytes(byteLength).toString('base64')
  await writeFile(path, `${value}\n`, { mode: 0o600 })
  await chmod(path, 0o600)
  return value
}

function parseEnv(text) { return Object.fromEntries(text.split(/\r?\n/u).filter((line) => line && !line.startsWith('#') && line.includes('=')).map((line) => { const index = line.indexOf('='); return [line.slice(0, index), unquote(line.slice(index + 1))] })) }
function unquote(value) { return value.startsWith("'") && value.endsWith("'") ? value.slice(1, -1).replaceAll("'\\''", "'") : value }
function shellQuote(value) { return `'${String(value).replaceAll("'", "'\\''")}'` }
async function livePid(path) { try { const pid = Number((await readFile(path, 'utf8')).trim()); process.kill(pid, 0); return pid } catch { return null } }
async function canConnect(host, port) { return new Promise((resolve) => { const socket = createConnection({ host, port }); const done = (result) => { socket.destroy(); resolve(result) }; socket.setTimeout(400, () => done(false)); socket.once('connect', () => done(true)); socket.once('error', () => done(false)) }) }
async function spawnChecked(file, args, extraEnv) { await new Promise((resolvePromise, reject) => { const child = spawn(file, args, { cwd: root, env: { ...process.env, ...extraEnv }, stdio: 'inherit' }); child.once('exit', (code) => code === 0 ? resolvePromise() : reject(new Error(`COMMAND_FAILED_${code}`))); child.once('error', reject) }) }
async function openAppend(path) { await mkdir(dirname(path), { recursive: true }); return (await import('node:fs')).openSync(path, 'a', 0o600) }

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (command === 'check') { const manifest = await generateProfile(); for (const service of manifest.services) { if ((await stat(service.envPath)).mode % 0o1000 !== 0o600) throw new Error('TRUSTED_RUNTIME_ENV_MODE_INVALID') }; process.stdout.write(`TRUSTED_RUNTIME_PROFILE_VALID services=${manifest.services.length}\n`) }
  else if (command === 'up') await up()
  else if (command === 'status') await status(false)
  else if (command === 'down') await down()
  else throw new Error('TRUSTED_RUNTIME_COMMAND_INVALID')
}
