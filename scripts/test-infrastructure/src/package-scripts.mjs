#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildWorkspaceGraph,
  discoverPackages,
  packageScriptsForKind
} from './test-infrastructure.mjs'

/** Parses the package-script orchestration CLI. */
function parseArguments(argv) {
  const values = {}
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (!argument.startsWith('--')) continue
    const [key, inline] = argument.slice(2).split('=', 2)
    values[key] = inline ?? (argv[index + 1]?.startsWith('--') ? 'true' : argv[++index] || 'true')
  }
  return values
}

/** Expands selected owners through build-time dependencies. */
function expandDependencies(initial, graph) {
  const result = new Set(initial)
  const queue = [...initial]
  while (queue.length) {
    const owner = queue.shift()
    for (const dependency of graph.dependencies.get(owner) || []) {
      if (result.has(dependency)) continue
      result.add(dependency)
      queue.push(dependency)
    }
  }
  return result
}

/** Runs one package script while retaining literal child output. */
function execute(root, record, script) {
  const cwd = resolve(root, record.directory)
  console.log(`PACKAGE_SCRIPT owner=${record.name} cwd=${record.directory} script=${script}`)
  return new Promise((resolvePromise) => {
    const child = spawn('pnpm', ['run', script], { cwd, env: process.env, stdio: 'inherit' })
    child.once('error', () => resolvePromise(1))
    child.once('exit', (status) => resolvePromise(status ?? 1))
  })
}

/** Produces dependency-safe batches so independent packages run in parallel. */
function topologicalBatches(records, graph) {
  const remaining = new Map(records.map((record) => [record.name, record]))
  const completed = new Set()
  const batches = []
  while (remaining.size) {
    const ready = [...remaining.values()]
      .filter((record) =>
        [...(graph.dependencies.get(record.name) || [])].every(
          (dependency) => completed.has(dependency) || !remaining.has(dependency)
        )
      )
      .sort((left, right) => left.name.localeCompare(right.name))
    if (!ready.length) throw new Error(`Workspace dependency cycle: ${[...remaining.keys()].sort().join(', ')}`)
    batches.push(ready)
    for (const record of ready) {
      remaining.delete(record.name)
      completed.add(record.name)
    }
  }
  return batches
}

const args = parseArguments(process.argv.slice(2))
const kind = args.kind
if (!['build', 'static'].includes(kind)) throw new Error('--kind must be build or static')
const root = resolve(args.root || process.cwd())
const plan = args.plan
  ? JSON.parse(readFileSync(resolve(args.plan), 'utf8'))
  : args.mode === 'FULL'
    ? { mode: 'FULL', owners: [] }
    : JSON.parse(readFileSync(resolve('.tmp/change-plan.json'), 'utf8'))
const packages = discoverPackages(root).filter((record) => record.directory)
const graph = buildWorkspaceGraph(packages)
if (graph.errors.length) throw new Error(`Workspace graph invalid: ${graph.errors.join(', ')}`)
const selected = new Set(plan.owners.map((owner) => owner.name))
const ownerNames = plan.mode === 'FULL' ? new Set(packages.map((record) => record.name)) : expandDependencies(selected, graph)
const records = packages.filter((record) => ownerNames.has(record.name))
let failures = 0

for (const batch of topologicalBatches(records, graph)) {
  const statuses = await Promise.all(
    batch.flatMap((record) =>
      packageScriptsForKind(record, kind)
        .map((script) => execute(root, record, script))
    )
  )
  failures += statuses.filter((status) => status !== 0).length
  if (failures) break
}

console.log(`PACKAGE_SCRIPTS=${failures ? 'FAIL' : 'PASS'} kind=${kind} owners=${records.length}`)
if (failures) process.exitCode = 1
