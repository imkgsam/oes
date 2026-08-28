#!/usr/bin/env node
import { chmod, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { spawn, spawnSync } from 'node:child_process'
import { createConnection } from 'node:net'
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
  await mkdir(join(stateRoot, 'env'), { recursive: true, mode: 0o700 })
  await mkdir(join(stateRoot, 'logs'), { recursive: true, mode: 0o700 })
  await mkdir(join(stateRoot, 'pids'), { recursive: true, mode: 0o700 })
  const endpoints = Object.fromEntries(inventory.map((entry, index) => [entry.workload, basePort + index]))
  const manifest = { version: 1, taskKey, stateRoot, trustRoot, nacos: `127.0.0.1:${nacosPort}`, services: [] }
  for (const entry of inventory) {
    const packageDirectory = resolve(root, entry.source.split('/src/')[0])
    const packageJson = JSON.parse(await readFile(join(packageDirectory, 'package.json'), 'utf8'))
    const env = { ...sourceEnvironment }
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
      DATABASE_URL: sourceEnvironment[`OES_DB_${entry.workload.replaceAll('-', '_').toUpperCase()}_URL`] || ''
    })
    const envPath = join(stateRoot, 'env', `${entry.workload}.env`)
    await writeFile(envPath, Object.entries(env).filter(([, value]) => value !== '').sort().map(([key, value]) => `${key}=${shellQuote(value)}`).join('\n') + '\n', { mode: 0o600 })
    await chmod(envPath, 0o600)
    manifest.services.push({ workload: entry.workload, packageName: packageJson.name, packageDirectory, port: endpoints[entry.workload], serverName: `${entry.workload}.localhost`, spiffeId: env.OES_WORKLOAD_SPIFFE_ID, envPath, certPath: env.OES_GRPC_TLS_CERT_PATH, logPath: join(stateRoot, 'logs', `${entry.workload}.log`), pidPath: join(stateRoot, 'pids', `${entry.workload}.pid`) })
  }
  await writeFile(join(stateRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { mode: 0o600 })
  await chmod(join(stateRoot, 'manifest.json'), 0o600)
  return manifest
}

/** Starts exact built package entrypoints and records only task-owned PIDs/logs. */
async function up() {
  await spawnChecked(join(root, 'docker/grpc-trust/bootstrap-local-trust.sh'), ['--output', trustRoot], { OES_TRUST_OUTPUT_DIRECTORY: trustRoot })
  const manifest = await generateProfile({ requireInfrastructure: true })
  for (const service of manifest.services) {
    if (await livePid(service.pidPath)) continue
    const environment = parseEnv(await readFile(service.envPath, 'utf8'))
    const child = spawn('pnpm', ['--filter', service.packageName, 'start'], { cwd: root, env: { ...process.env, ...environment }, detached: true, stdio: ['ignore', await openAppend(service.logPath), await openAppend(service.logPath)] })
    child.unref()
    await writeFile(service.pidPath, `${child.pid}\n`, { mode: 0o600 })
  }
  await status(true)
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
