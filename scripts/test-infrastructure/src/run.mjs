#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  discoverPackages,
  discoverTests,
  findOwner,
  findWorkspaceRoot,
  integrationOwnersForTests,
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
  if (path.startsWith('tests/cross-service/') && path.endsWith('.kt')) {
    const pdaRoot = resolve(root, 'app/pda/android')
    if (existsSync(resolve(pdaRoot, 'gradlew'))) return pdaRoot
  }
  let current = resolve(root, dirname(path))
  while (current.startsWith(root)) {
    if (existsSync(resolve(current, 'gradlew'))) return current
    if (current === root) break
    current = dirname(current)
  }
  return null
}

/** Lists package boundaries from the nearest owner through the repository root. */
function packageAncestors(directory, packages) {
  const normalized = directory.replaceAll('\\', '/').replace(/^\.\//u, '')
  return packages
    .filter(
      (record) =>
        !record.directory ||
        normalized === record.directory ||
        normalized.startsWith(`${record.directory}/`)
    )
    .sort((left, right) => right.directory.split('/').length - left.directory.split('/').length)
}

/** Finds the nearest package that actually provides a requested runner. */
function findRunnerPackage(root, owner, packages, runner) {
  const configNames =
    runner === 'jest'
      ? ['jest.config.js', 'jest.config.cjs', 'jest.config.mjs', 'jest.config.ts']
      : ['vitest.config.js', 'vitest.config.mjs', 'vitest.config.ts']
  for (const record of packageAncestors(owner?.directory || '', packages)) {
    const cwd = resolve(root, record.directory || '.')
    const config = configNames.map((name) => resolve(cwd, name)).find(existsSync)
    if (config || record.dependencies?.[runner]) return { config, cwd, record }
  }
  return null
}

/** Finds a package-owned ts-node acceptance configuration for Node test files. */
function findTsNodeProject(root, owner, packages) {
  for (const record of packageAncestors(owner?.directory || '', packages)) {
    const project = resolve(root, record.directory || '.', 'tsconfig.acceptance.json')
    if (existsSync(project)) return { cwd: resolve(root, record.directory || '.'), project }
  }
  return null
}

/** Detects a real top-level ESM import instead of runner names embedded in test fixture strings. */
function importsModule(source, specifier) {
  const escaped = specifier.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
  return new RegExp(
    `(?:^|\\n)\\s*import(?:\\s+[^\\n'\"]+?\\s+from)?\\s*['\"]${escaped}['\"]`,
    'u'
  ).test(source)
}

/** Chooses the mature package-native runner from package declarations and file syntax. */
export function classifyRunner(root, test, packages) {
  if (test.path.endsWith('Test.kt') || test.path.endsWith('.spec.kt')) {
    const cwd = findGradleRoot(root, test.path)
    if (!cwd) throw new Error(`No Gradle wrapper owns ${test.path}`)
    return { kind: 'gradle', cwd, key: `gradle:${cwd}` }
  }
  const owner = findOwner(test.path, packages)
  const workspaceDirectory = owner?.directory ? findWorkspaceRoot(root, owner.directory) : ''
  const workspaceOwner = packages.find((record) => record.directory === workspaceDirectory)
  const dependencies = { ...(workspaceOwner?.dependencies || {}), ...(owner?.dependencies || {}) }
  const source = readFileSync(resolve(root, test.path), 'utf8')
  if (
    test.type === 'journey' &&
    (dependencies['@playwright/test'] || importsModule(source, '@playwright/test'))
  ) {
    const cwd = resolve(root, workspaceDirectory || owner?.directory || '.')
    return { kind: 'playwright', cwd, key: `playwright:${cwd}` }
  }
  if (importsModule(source, 'node:test')) {
    const acceptance = test.path.endsWith('.ts') ? findTsNodeProject(root, owner, packages) : null
    if (acceptance) {
      return {
        kind: 'ts-node',
        cwd: acceptance.cwd,
        environment: { TS_NODE_PROJECT: acceptance.project, TS_NODE_TRANSPILE_ONLY: 'false' },
        key: `ts-node:${acceptance.cwd}`
      }
    }
    return { kind: 'node', cwd: root, key: 'node:repository' }
  }
  if (dependencies.vitest || importsModule(source, 'vitest')) {
    const provider = findRunnerPackage(root, owner, packages, 'vitest')
    const cwd = provider?.cwd || resolve(root, workspaceDirectory || owner?.directory || '.')
    return { kind: 'vitest', cwd, key: `vitest:${cwd}` }
  }
  if (test.owner === 'cross-service') {
    const cwd = resolve(root, 'tests/cross-service')
    return {
      kind: 'jest',
      cwd,
      jestConfig: resolve(cwd, 'jest.config.cjs'),
      key: `jest:${cwd}`
    }
  }
  const provider = findRunnerPackage(root, owner, packages, 'jest')
  const cwd = provider?.cwd || resolve(root, owner?.directory || '.')
  return { kind: 'jest', cwd, jestConfig: provider?.config, key: `jest:${cwd}` }
}

/** Converts one runner group into its exact executable and arguments. */
export function commandForGroup(root, group) {
  const relativePaths = group.tests.map((test) =>
    relative(group.runner.cwd, resolve(root, test.path))
  )
  const hasType = (type) => group.tests.some((test) => test.type === type)
  switch (group.runner.kind) {
    case 'node':
      return {
        command: process.execPath,
        args: [
          ...(group.tests.some((test) => test.path.endsWith('.ts'))
            ? ['--experimental-strip-types']
            : []),
          ...(hasType('journey') ? ['--test-timeout=300000'] : []),
          '--test',
          ...group.tests.map((test) => test.path)
        ]
      }
    case 'ts-node':
      return {
        command: process.execPath,
        args: [
          '--test',
          '--require',
          'ts-node/register',
          '--require',
          'tsconfig-paths/register',
          ...relativePaths
        ]
      }
    case 'vitest':
      return {
        command: 'pnpm',
        args: [
          'exec',
          'vitest',
          'run',
          ...(hasType('component') || hasType('integration') ? ['--testTimeout=30000'] : []),
          ...relativePaths
        ]
      }
    case 'playwright':
      return {
        command: 'pnpm',
        args: ['exec', 'playwright', 'test', '--timeout=300000', ...relativePaths]
      }
    case 'gradle':
      return {
        command: './gradlew',
        args: [
          ':app:testDebugUnitTest',
          '--no-daemon',
          ...group.tests.flatMap((test) => ['--tests', gradleTestClass(root, test.path)])
        ]
      }
    default:
      return {
        command: 'pnpm',
        args: [
          'exec',
          'jest',
          ...(group.runner.jestConfig ? ['--config', group.runner.jestConfig] : []),
          '--runInBand',
          ...(hasType('journey')
            ? ['--testTimeout', '300000']
            : hasType('component') || hasType('integration')
              ? ['--testTimeout', '30000']
              : []),
          '--runTestsByPath',
          ...relativePaths
        ]
      }
  }
}

/** Resolves the package and first declared class for a focused JVM Journey filter. */
function gradleTestClass(root, testPath) {
  const source = readFileSync(resolve(root, testPath), 'utf8')
  const packageName = source.match(/^\s*package\s+([\w.]+)/mu)?.[1]
  const className = source.match(/^\s*class\s+(\w+)/mu)?.[1]
  if (!packageName || !className) throw new Error(`No JVM test class found in ${testPath}`)
  return `${packageName}.${className}`
}

/** Assigns proven shared-resource conflicts to one serial execution group. */
function serialGroupFor(test, relationships) {
  return (relationships.sharedResources || []).find((resource) =>
    matchesAny(test.path, resource.triggers)
  )?.serialGroup
}

/** Merges owner-specific URLs and credentials without assigning an ambiguous generic database. */
function environmentForRunnerGroup(environmentForOwner, tests, relationships) {
  const ownerNames = integrationOwnersForTests(tests, relationships)
  const merged = {}
  for (const ownerName of ownerNames) {
    const ownerEnvironment = { ...environmentForOwner(ownerName) }
    if (tests[0]?.type === 'journey' && ownerNames.length > 1) {
      delete ownerEnvironment.DATABASE_URL
      delete ownerEnvironment.OES_INTEGRATION_DATABASE_URL
    }
    Object.assign(merged, ownerEnvironment)
  }
  return merged
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

/** Resolves the bounded cross-package parallelism used on two-core hosted runners. */
export function resolveGroupConcurrency(raw = process.env.OES_TEST_GROUP_CONCURRENCY) {
  if (raw === undefined || raw === '') return 2
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1 || value > 16) {
    throw new Error('OES_TEST_GROUP_CONCURRENCY must be an integer from 1 through 16')
  }
  return value
}

/** Maps work with a fixed worker count while preserving input-order results. */
export async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length)
  let cursor = 0
  async function runWorker() {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()))
  return results
}

/** Supplies the service's shipped gRPC listener port to registry composition tests. */
export function serviceListenerEnvironment(root, runner, baseEnvironment = process.env) {
  if (baseEnvironment.SERVICE_REGISTRY_PORT) return {}
  const mainPath = resolve(runner.cwd, 'src/main.ts')
  if (!existsSync(mainPath)) return {}
  const source = readFileSync(mainPath, 'utf8')
  const defaultPort = source.match(/GRPC_LISTEN_PORT\s*\|\|\s*['"](\d+)['"]/u)?.[1]
  const listenerPort = baseEnvironment.GRPC_LISTEN_PORT || defaultPort
  if (!listenerPort) return {}
  return {
    GRPC_LISTEN_PORT: listenerPort,
    SERVICE_REGISTRY_PORT: listenerPort
  }
}

/** Executes one taxonomy lane from its immutable change plan. */
export async function main(argv = process.argv.slice(2)) {
  const args = parseArguments(argv)
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
  const selected = paths
    .map((path) => discovery.tests.find((test) => test.path === path))
    .filter(Boolean)
    .filter((test) => !args.owner || test.owner === args.owner)

  if (!selected.length) {
    console.log(`TEST_RUN=PASS type=${type} selected=0`)
    return 0
  }

  const groups = new Map()
  for (const test of selected) {
    const runner = classifyRunner(root, test, packages)
    const serialGroup = serialGroupFor(test, relationships)
    const key = serialGroup ? `serial:${serialGroup}` : `${runner.key}:owner=${test.owner}`
    if (!groups.has(key)) groups.set(key, { runner, tests: [] })
    groups.get(key).tests.push(test)
  }
  for (const group of groups.values())
    group.tests.sort((left, right) => left.path.localeCompare(right.path))

  const runId = process.env.OES_TEST_RUN_ID || `${Date.now()}_${process.pid}`
  const taskKey = resolveIntegrationTaskKey(root, process.env.OES_CI_TASK_KEY, `test_${runId}`)
  const environment = {
    ...process.env,
    TZ: process.env.TZ || 'Asia/Shanghai',
    OES_TEST_RUN_ID: runId,
    OES_CI_TASK_KEY: taskKey
  }
  /** Runs groups with bounded parallelism; declared shared-resource groups remain internally serial. */
  async function runGroups(environmentForOwner = () => ({})) {
    return mapWithConcurrency([...groups.values()], resolveGroupConcurrency(), async (group) => {
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
        const testEnvironment = {
          ...environment,
          OES_REPOSITORY_ROOT: root,
          npm_package_name: runnerGroup.tests[0].owner,
          ...(runnerGroup.runner.environment || {}),
          ...serviceListenerEnvironment(root, runnerGroup.runner, environment),
          ...environmentForRunnerGroup(environmentForOwner, runnerGroup.tests, relationships)
        }
        if (runnerGroup.runner.kind === 'gradle') {
          const pdaBuild = await execute('pnpm', ['--dir', 'app/pda', 'build:web'], {
            cwd: root,
            env: testEnvironment
          })
          if (pdaBuild !== 0) {
            status = pdaBuild
            continue
          }
        }
        const current = await execute(command.command, command.args, {
          cwd: runnerGroup.runner.cwd,
          env: testEnvironment
        })
        if (current !== 0) status = current
      }
      return status
    })
  }

  const statuses =
    type === 'integration' || type === 'journey'
      ? await withIntegrationRuntime({
          root,
          ownerNames: integrationOwnersForTests(selected, relationships),
          taskKey: environment.OES_CI_TASK_KEY,
          runTests: runGroups
        })
      : await runGroups()
  const failures = statuses.filter((status) => status !== 0).length
  console.log(
    `TEST_RUN=${failures ? 'FAIL' : 'PASS'} type=${type} selected=${selected.length} groups=${groups.size}`
  )
  return failures ? 1 : 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main()
}
