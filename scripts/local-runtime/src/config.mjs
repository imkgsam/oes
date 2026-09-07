import fs from 'node:fs'
import path from 'node:path'
import { expandHome, fingerprint } from './canonical.mjs'

const TUNABLES = new Set(['OES_RUNTIME_CONCURRENCY', 'OES_RUNTIME_LOG_LEVEL'])
const FORBIDDEN_BINDINGS = /(?:DATABASE|REDIS|NATS|MINIO|NACOS|OTEL|PORT|CERT|KEY|CREDENTIAL|RUN_ID|TASK_KEY|DEV_STACK)/u

/** Parses the explicit machine config grammar without dotenv discovery. */
export function parseMachineConfig(source, origin) {
  const values = {}
  for (const [index, raw] of source.split(/\r?\n/u).entries()) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/u)
    if (!match) throw new Error(`MACHINE_CONFIG_LINE_INVALID origin=${origin} line=${index + 1}`)
    const [, key, value] = match
    if (!TUNABLES.has(key) || FORBIDDEN_BINDINGS.test(key)) throw new Error(`MACHINE_CONFIG_KEY_FORBIDDEN key=${key}`)
    if (Object.hasOwn(values, key)) throw new Error(`MACHINE_CONFIG_KEY_DUPLICATE key=${key}`)
    values[key] = value.replace(/^(['"])(.*)\1$/u, '$2')
  }
  return values
}

/** Builds the validated in-memory launcher config using the frozen precedence order. */
export function loadRuntimeConfig({ root, profile, explicit = {}, machineConfigPath, stateRoot }) {
  const defaults = JSON.parse(fs.readFileSync(path.join(root, 'scripts/local-runtime/defaults.json'), 'utf8'))
  const recipe = defaults.profiles[profile]
  if (!recipe) throw new Error(`RUNTIME_PROFILE_INVALID profile=${profile}`)
  const configPath = expandHome(machineConfigPath || defaults.machineConfig)
  const machine = fs.existsSync(configPath) ? parseMachineConfig(fs.readFileSync(configPath, 'utf8'), configPath) : {}
  const concurrencyRaw = explicit.concurrency ?? machine.OES_RUNTIME_CONCURRENCY ?? defaults.realInfrastructureConcurrency
  const concurrency = Number(concurrencyRaw)
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16) throw new Error(`RUNTIME_CONCURRENCY_INVALID value=${concurrencyRaw}`)
  const output = {
    schemaVersion: 2,
    profile,
    recipe,
    concurrency,
    logLevel: explicit.logLevel ?? machine.OES_RUNTIME_LOG_LEVEL ?? 'info',
    stateRoot: expandHome(stateRoot || defaults.stateRoot),
    machineConfigPath: configPath,
    sourceOrder: ['repository-defaults', 'machine-config', profile, 'explicit-arguments', 'dynamic-allocation']
  }
  output.configFingerprint = fingerprint(output)
  return Object.freeze(output)
}
