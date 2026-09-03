#!/usr/bin/env node
import { createConnection } from 'node:net'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { readInventory } from './trusted-runtime.mjs'

const VALID_SCOPES = new Set(['system', 'business', 'full'])

/** Selects the exact listener set that one foreground backend command is about to own. */
export function selectBackendListenerTargets(
  inventory,
  scope,
  {
    basePort = Number(process.env.OES_TRUSTED_RUNTIME_BASE_PORT || 52050),
    gatewayPort = Number(process.env.OES_TRUSTED_RUNTIME_GATEWAY_PORT || 52101)
  } = {}
) {
  if (!VALID_SCOPES.has(scope)) throw new Error('BACKEND_PREFLIGHT_SCOPE_INVALID')
  if (!Number.isInteger(basePort) || !Number.isInteger(gatewayPort)) {
    throw new Error('BACKEND_PREFLIGHT_PORT_INVALID')
  }

  const targets = inventory
    .map((entry, index) => ({
      workload: entry.workload,
      port: basePort + index,
      system: entry.source.includes('/system/')
    }))
    .filter((entry) => {
      if (scope === 'full') return true
      return scope === 'system' ? entry.system : !entry.system
    })
    .map(({ workload, port }) => ({ workload, port }))

  if (scope !== 'business') targets.push({ workload: 'api-gateway', port: gatewayPort })
  return targets
}

/** Returns every selected listener that is already reachable before watchers are created. */
export async function findOccupiedBackendListeners(targets, connect = canConnect) {
  const occupancy = await Promise.all(
    targets.map(async (target) => ({ ...target, occupied: await connect(target.port) }))
  )
  return occupancy
    .filter((target) => target.occupied)
    .map(({ workload, port }) => ({ workload, port }))
}

async function main() {
  const scope = process.argv[2]?.trim()
  const targets = selectBackendListenerTargets(await readInventory(), scope)
  const occupied = await findOccupiedBackendListeners(targets)
  if (occupied.length > 0) {
    process.stderr.write(
      `BACKEND_START_BLOCKED scope=${scope} occupied=${occupied
        .map((target) => `${target.workload}:${target.port}`)
        .join(',')} action="stop the existing pnpm backend with Ctrl+C, or keep using it"\n`
    )
    process.exitCode = 1
    return
  }
  process.stdout.write(`BACKEND_START_READY scope=${scope} listeners=${targets.length}\n`)
}

function canConnect(port) {
  return new Promise((resolvePromise) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    const done = (result) => {
      socket.destroy()
      resolvePromise(result)
    }
    socket.setTimeout(250, () => done(false))
    socket.once('connect', () => done(true))
    socket.once('error', () => done(false))
  })
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
