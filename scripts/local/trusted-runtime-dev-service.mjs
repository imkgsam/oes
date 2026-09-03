#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'
import { join, resolve } from 'node:path'
import process from 'node:process'
import {
  parseTrustedRuntimeEnvironment,
  resolveTrustedRuntimeTaskKey,
  selectDevelopmentDependencies,
  selectDevelopmentService
} from './trusted-runtime.mjs'

const root = resolve(import.meta.dirname, '../..')

/** Runs one watched package with only its prepared task-owned trusted runtime environment. */
async function main() {
  const workload = process.argv[2]
  const taskKey = resolveTrustedRuntimeTaskKey({ repositoryRoot: root })
  const stateRoot = resolve(
    process.env.OES_TRUSTED_RUNTIME_STATE || join(root, '.tmp/oes-trusted-runtime', taskKey)
  )
  const manifest = JSON.parse(await readFile(join(stateRoot, 'manifest.json'), 'utf8'))
  if (manifest.taskKey !== taskKey) throw new Error('TRUSTED_RUNTIME_DEV_TASK_MISMATCH')
  const service = selectDevelopmentService(manifest, workload)
  const scope = process.env.OES_TRUSTED_RUNTIME_DEV_SCOPE?.trim() || 'single'
  const dependencies = selectDevelopmentDependencies(manifest, workload, scope)
  await waitForDependencies(dependencies, 120_000)
  const environment = parseTrustedRuntimeEnvironment(await readFile(service.envPath, 'utf8'))
  for (const key of [
    'AUTH_EXECUTION_ISSUER',
    'OES_GRPC_TLS_ENABLED',
    'OES_GRPC_TLS_CA_PATH',
    'OES_GRPC_TLS_CERT_PATH',
    'OES_GRPC_TLS_KEY_PATH'
  ]) {
    if (!environment[key]?.trim()) throw new Error(`TRUSTED_RUNTIME_DEV_ENV_REQUIRED_${key}`)
  }

  const child = spawn('pnpm', ['--filter', service.packageName, 'dev'], {
    cwd: root,
    env: { ...process.env, ...environment },
    stdio: 'inherit'
  })
  let forwardedSignal
  let forceTimer
  const forward = (signal) => {
    if (forwardedSignal || child.exitCode !== null) return
    forwardedSignal = signal
    child.kill(signal)
    forceTimer = setTimeout(() => child.kill('SIGKILL'), 5_000)
  }
  process.once('SIGINT', () => forward('SIGINT'))
  process.once('SIGTERM', () => forward('SIGTERM'))
  child.once('error', (error) => {
    throw error
  })
  child.once('exit', (code, signal) => {
    if (forceTimer) clearTimeout(forceTimer)
    if (forwardedSignal) process.exitCode = 0
    else if (signal) process.kill(process.pid, signal)
    else process.exitCode = code ?? 1
  })
}

/** Stages watcher compilation behind earlier listener groups so signer readiness stays bounded. */
async function waitForDependencies(dependencies, timeoutMs) {
  if (dependencies.length === 0) return
  process.stdout.write(
    `TRUSTED_RUNTIME_DEV_WAIT dependencies=${dependencies.map((item) => item.workload).join(',')}\n`
  )
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if ((await Promise.all(dependencies.map((item) => canConnect(item.port)))).every(Boolean)) {
      process.stdout.write(`TRUSTED_RUNTIME_DEV_DEPENDENCIES_READY count=${dependencies.length}\n`)
      return
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250))
  }
  throw new Error(
    `TRUSTED_RUNTIME_DEV_DEPENDENCY_TIMEOUT_${dependencies.map((item) => item.workload).join('_')}`
  )
}

function canConnect(port) {
  return new Promise((resolvePromise) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    const done = (result) => {
      socket.destroy()
      resolvePromise(result)
    }
    socket.setTimeout(300, () => done(false))
    socket.once('connect', () => done(true))
    socket.once('error', () => done(false))
  })
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
