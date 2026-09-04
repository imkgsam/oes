#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import {
  discoverPackages,
  discoverTests,
  findOwner,
  findWorkspaceRoot,
  matchesAny,
  readJson,
  TEST_TYPES
} from './test-infrastructure.mjs'
import { resolveIntegrationTaskKey, withIntegrationRuntime } from './integration-runtime.mjs'

/** Parses the runner CLI without adding a dependency to the bootstrap path. */
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

/** Finds an executable Gradle wrapper above an Android-native test. */
function findGradleRoot(root, path) {
  let current = resolve(root, dirname(path))
  while (current.startsWith(root)) {
    if (existsSync(resolve(current, 'gradlew'))) return current
    if (current === root) break
    current = dirname(current)
  }
  return null
}

/** Chooses the mature package-native runner from package declarations and file syntax. */
function classifyRunner(root, test, packages) {
  if (test.path.endsWith('Test.kt')) {
    const cwd = findGradleRoot(root, test.path)
    if (!cwd) throw new Error(`No Gradle wrapper owns ${test.path}`)
    return { kind: 'gradle', cwd, key: `gradle:${cwd}` }
  }
  const owner = findOwner(test.path, packages)
  const workspaceDirectory = owner?.directory ? findWorkspaceRoot(root, owner.directory) : ''
  const workspaceOwner = packages.find((record) => record.directory === workspaceDirectory)
  const dependencies = { ...(workspaceOwner?.dependencies || {}), ...(owner?.dependencies || {}) }
  const source = readFileSync(resolve(root, test.path), 'utf8')
  if (test.type === 'journey' && (dependencies['@playwright/test'] || /@playwright\/test/.test(source))) {
    const cwd = resolve(root, workspaceDirectory || owner?.directory || '.')
    return { kind: 'playwright', cwd, key: `playwright:${cwd}` }
  }
  if (dependencies.vitest || /from ['"]vitest['"]/.test(source)) {
    const cwd = resolve(root, workspaceDirectory || owner?.directory || '.')
    return { kind: 'vitest', cwd, key: `vitest:${cwd}` }
  }
  if (/node:test/.test(source)) {
    return { kind: 'node', cwd: root, key: 'node:repository' }
  }
  const cwd = resolve(root, owner?.directory || '.')
  return { kind: 'jest', cwd, key: `jest:${cwd}` }
}

/** Converts one runner group into its exact executable and arguments. */
function commandForGroup(root, group) {
  const relativePaths = group.tests.map((test) => relative(group.runner.cwd, resolve(root, test.path)))
  switch (group.runner.kind) {
    case 'node':
      return {
        command: process.execPath,
        args: [
          ...(group.tests.some((test) => test.path.endsWith('.ts')) ? ['--experimental-strip-types'] : []),
          ...(group.tests.some((test) => test.type === 'journey')
            ? ['--test-timeout=300000']
            : []),
          '--test',
          ...group.tests.map((test) => test.path)
        ]
      }
    case 'vitest':
      return {
        command: 'pnpm',
        args: [
          'exec',
          'vitest',
          'run',
          ...(group.tests.some((test) => test.type === 'integration')
            ? ['--testTimeout=30000']
            : []),
          ...relativePaths
        ]
      }
    case 'playwright':
      return {
        command: 'pnpm',
        args: ['exec', 'playwright', 'test', '--timeout=300000', ...relativePaths]
      }
    case 'gradle':
      return { command: './gradlew', args: ['test', '--no-daemon'] }
    default:
      return {
        command: 'pnpm',
        args: [
          'exec',
          'jest',
          '--runInBand',
          ...(group.tests.some((test) => test.type === 'journey')
            ? ['--testTimeout', '300000']
            : group.tests.some((test) => test.type === 'integration')
              ? ['--testTimeout', '30000']
              : []),
          '--runTestsByPath',
          ...relativePaths
        ]
      }
  }
}

/** Assigns proven shared-resource conflicts to one serial execution group. */
function serialGroupFor(test, relationships) {
  return (relationships.sharedResources || []).find((resource) =>
    matchesAny(test.path, resource.triggers)
  )?.serialGroup
}

/** Runs one process while preserving its literal output and exit status. */
function execute(command, args, options) {
  console.log(`RUN cwd=${options.cwd} command=${JSON.stringify([command, ...args])}`)
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, { ...options, stdio: 'inherit' })
    child.on('error', (error) => {
      console.error(`RUN_ERROR ${error.message}`)
      resolvePromise(1)
    })
    child.on('exit', (code, signal) => {
      const status = code ?? 1
      console.log(`RUN_EXIT status=${status}${signal ? ` signal=${signal}` : ''}`)
      resolvePromise(status)
    })
  })
}

const args = parseArguments(process.argv.slice(2))
const root = resolve(args.root || process.cwd())
const type = args.type
if (!TEST_TYPES.includes(type)) throw new Error(`--type must be one of ${TEST_TYPES.join(', ')}`)
const packages = discoverPackages(root)
const discovery = discoverTests({ root, packages })
if (discovery.violations.length) {
  throw new Error(`Test discovery has ${discovery.violations.length} fail-closed violation(s)`)
}
const relationships = readJson(resolve(root, 'scripts/test-infrastructure/relationships.json'))
let paths
if (args.plan) {
  const plan = JSON.parse(readFileSync(resolve(args.plan), 'utf8'))
  paths = plan.selectedTests[type] || []
} else paths = discovery.tests.filter((test) => test.type === type).map((test) => test.path)
const selected = paths.map((path) => discovery.tests.find((test) => test.path === path)).filter(Boolean)

if (!selected.length) {
  console.log(`TEST_RUN=PASS type=${type} selected=0`)
  process.exit(0)
}

const groups = new Map()
for (const test of selected) {
  const runner = classifyRunner(root, test, packages)
  const serialGroup = serialGroupFor(test, relationships)
  const key = serialGroup ? `serial:${serialGroup}` : `${runner.key}:owner=${test.owner}`
  if (!groups.has(key)) groups.set(key, { runner, tests: [] })
  groups.get(key).tests.push(test)
}
for (const group of groups.values()) group.tests.sort((left, right) => left.path.localeCompare(right.path))

const runId = process.env.OES_TEST_RUN_ID || `${Date.now()}_${process.pid}`
const taskKey = resolveIntegrationTaskKey(
  root,
  process.env.OES_CI_TASK_KEY,
  `test_${runId}`
)
const environment = {
  ...process.env,
  OES_TEST_RUN_ID: runId,
  OES_CI_TASK_KEY: taskKey,
  COMPOSE_PROJECT_NAME:
    process.env.COMPOSE_PROJECT_NAME || `oes_${taskKey}`.replace(/[^a-zA-Z0-9_-]/g, '_')
}
/** Runs all groups concurrently except groups deliberately collapsed by a serialGroup. */
async function runGroups(environmentForOwner = () => ({})) {
  return Promise.all(
    [...groups.values()].map(async (group) => {
      let status = 0
      const runnerGroups = new Map()
      for (const test of group.tests) {
        const runner = classifyRunner(root, test, packages)
        const key = `${runner.key}:owner=${test.owner}`
        if (!runnerGroups.has(key)) runnerGroups.set(key, { runner, tests: [] })
        runnerGroups.get(key).tests.push(test)
      }
      for (const runnerGroup of runnerGroups.values()) {
        const command = commandForGroup(root, runnerGroup)
        const owner = runnerGroup.tests[0].owner
        const testEnvironment = {
          ...environment,
          ...environmentForOwner(owner)
        }
        const current = await execute(command.command, command.args, {
          cwd: runnerGroup.runner.cwd,
          env: testEnvironment
        })
        if (current !== 0) status = current
      }
      return status
    })
  )
}

const statuses =
  type === 'integration'
    ? await withIntegrationRuntime({
        root,
        ownerNames: selected.map((test) => test.owner),
        taskKey: environment.OES_CI_TASK_KEY,
        runTests: runGroups
      })
    : await runGroups()
const failures = statuses.filter((status) => status !== 0).length
console.log(`TEST_RUN=${failures ? 'FAIL' : 'PASS'} type=${type} selected=${selected.length} groups=${groups.size}`)
if (failures) process.exitCode = 1
