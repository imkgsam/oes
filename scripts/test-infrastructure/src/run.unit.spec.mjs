import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import {
  classifyRunner,
  commandForGroup,
  mapWithConcurrency,
  resolveGroupConcurrency,
  serviceListenerEnvironment
} from './run.mjs'

function write(root, path, content) {
  const target = resolve(root, path)
  mkdirSync(resolve(target, '..'), { recursive: true })
  writeFileSync(target, content)
}

test('runner selection uses the nearest package that actually provides Vitest or Jest', () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-runner-selection-'))
  try {
    write(root, 'pnpm-workspace.yaml', "packages: ['app/pda/web', 'site/*']\n")
    write(root, 'app/pda/pnpm-workspace.yaml', "packages: ['web']\n")
    write(root, 'app/pda/web/src/example.unit.spec.ts', "import { test } from 'vitest'\n")
    write(
      root,
      'scripts/test-infrastructure/src/runner.unit.spec.mjs',
      `import test from 'node:test'\nconst fixture = "from 'vitest'"\ntest(fixture, () => {})\n`
    )
    write(root, 'site/storefront/src/example.unit.spec.ts', "describe('example', () => {})\n")
    write(root, 'site/jest.config.cjs', 'module.exports = {}\n')
    const packages = [
      { directory: 'app/pda/web', name: '@oes/pda-web', dependencies: { vitest: '^3' } },
      { directory: 'app/pda', name: 'pda-workspace', dependencies: {} },
      { directory: 'site/storefront', name: '@oes/storefront', dependencies: {} },
      { directory: 'site', name: '@oes/site', dependencies: {} },
      {
        directory: 'scripts/test-infrastructure',
        name: '@oes/test-infrastructure',
        dependencies: {}
      },
      { directory: '', name: 'root', dependencies: { jest: '^29' } }
    ]

    const vitest = classifyRunner(
      root,
      {
        owner: '@oes/pda-web',
        path: 'app/pda/web/src/example.unit.spec.ts',
        type: 'unit'
      },
      packages
    )
    assert.equal(vitest.kind, 'vitest')
    assert.equal(vitest.cwd, resolve(root, 'app/pda/web'))

    const jest = classifyRunner(
      root,
      {
        owner: '@oes/storefront',
        path: 'site/storefront/src/example.unit.spec.ts',
        type: 'unit'
      },
      packages
    )
    assert.equal(jest.kind, 'jest')
    assert.equal(jest.cwd, resolve(root, 'site'))
    assert.equal(jest.jestConfig, resolve(root, 'site/jest.config.cjs'))
    assert.deepEqual(
      commandForGroup(root, {
        runner: jest,
        tests: [
          {
            owner: '@oes/storefront',
            path: 'site/storefront/src/example.unit.spec.ts',
            type: 'unit'
          }
        ]
      }).args.slice(0, 4),
      ['exec', 'jest', '--config', resolve(root, 'site/jest.config.cjs')]
    )

    const node = classifyRunner(
      root,
      {
        owner: '@oes/test-infrastructure',
        path: 'scripts/test-infrastructure/src/runner.unit.spec.mjs',
        type: 'unit'
      },
      packages
    )
    assert.equal(node.kind, 'node')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('TypeScript Node acceptance tests reuse their package ts-node project', () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-runner-ts-node-'))
  try {
    write(root, 'pnpm-workspace.yaml', "packages: ['site']\n")
    write(root, 'site/tsconfig.acceptance.json', '{}\n')
    write(root, 'site/test/example.node.integration.spec.ts', "import test from 'node:test'\n")
    const runner = classifyRunner(
      root,
      {
        owner: '@oes/site',
        path: 'site/test/example.node.integration.spec.ts',
        type: 'integration'
      },
      [
        { directory: 'site', name: '@oes/site', dependencies: {} },
        { directory: '', name: 'root', dependencies: { jest: '^29' } }
      ]
    )
    assert.equal(runner.kind, 'ts-node')
    assert.equal(runner.cwd, resolve(root, 'site'))
    assert.equal(runner.environment.TS_NODE_PROJECT, resolve(root, 'site/tsconfig.acceptance.json'))
    assert.deepEqual(
      commandForGroup(root, {
        runner,
        tests: [
          {
            owner: '@oes/site',
            path: 'site/test/example.node.integration.spec.ts',
            type: 'integration'
          }
        ]
      }).args.slice(0, 5),
      ['--test', '--require', 'ts-node/register', '--require', 'tsconfig-paths/register']
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('group concurrency is bounded, validated, and preserves result order', async () => {
  assert.equal(resolveGroupConcurrency(), 2)
  assert.equal(resolveGroupConcurrency('4'), 4)
  assert.throws(() => resolveGroupConcurrency('0'), /integer from 1 through 16/u)
  let active = 0
  let highWatermark = 0
  const results = await mapWithConcurrency([3, 2, 1, 0], 2, async (value) => {
    active += 1
    highWatermark = Math.max(highWatermark, active)
    await new Promise((resolvePromise) => setTimeout(resolvePromise, value * 2))
    active -= 1
    return value * 10
  })
  assert.equal(highWatermark, 2)
  assert.deepEqual(results, [30, 20, 10, 0])
})

test('component commands carry the hosted-runner timeout budget', () => {
  const runner = { kind: 'vitest', cwd: '/fixture', key: 'vitest:/fixture' }
  const command = commandForGroup('/fixture', {
    runner,
    tests: [{ owner: 'fixture', path: 'component.component.spec.ts', type: 'component' }]
  })
  assert.ok(command.args.includes('--testTimeout=30000'))
})

test('service runner groups inherit the shipped gRPC listener port for registry composition', () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-runner-listener-'))
  try {
    write(
      root,
      'service/src/main.ts',
      "const url = `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50123'}`\n"
    )
    const runner = { kind: 'jest', cwd: resolve(root, 'service'), key: 'jest:service' }
    assert.deepEqual(serviceListenerEnvironment(root, runner, {}), {
      GRPC_LISTEN_PORT: '50123',
      SERVICE_REGISTRY_PORT: '50123'
    })
    assert.deepEqual(serviceListenerEnvironment(root, runner, { GRPC_LISTEN_PORT: '50999' }), {
      GRPC_LISTEN_PORT: '50999',
      SERVICE_REGISTRY_PORT: '50999'
    })
    assert.deepEqual(serviceListenerEnvironment(root, runner, { SERVICE_REGISTRY_PORT: '50000' }), {})
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
