import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { resolveIntegrationTaskKey, withIntegrationRuntime } from './integration-runtime.mjs'

test('integration task identity prefers explicit CI ownership and otherwise reuses the worktree', () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-integration-owner-'))
  try {
    writeFileSync(join(root, '.env'), 'OES_TASK_KEY=worktree_owner\n')
    assert.equal(resolveIntegrationTaskKey(root, 'ci_owner', 'fallback'), 'ci_owner')
    assert.equal(resolveIntegrationTaskKey(root, undefined, 'fallback'), 'worktree_owner')
    rmSync(join(root, '.env'))
    assert.equal(resolveIntegrationTaskKey(root, undefined, 'fallback'), 'fallback')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('integration runtime selects service inventory, enables live tests, and always tears down', async () => {
  const commands = []
  let residueChecked = false
  const services = [
    { name: 'notification-service', database: 'notification_test' },
    { name: 'collaboration-service', database: 'collaboration_test' },
    { name: 'unselected-service', database: 'unselected_test' }
  ]
  const context = {
    taskKey: 'fixture_task',
    stateDirectory: '/tmp/fixture-integration-state',
    rootValues: new Map([
      ['OES_POSTGRES_USER', 'fixture_user'],
      ['OES_POSTGRES_PASSWORD', 'fixture_password']
    ]),
    services
  }
  const failure = new Error('test failure sentinel')

  await assert.rejects(
    withIntegrationRuntime({
      root: '/fixture/repository',
      ownerNames: ['notification-service', 'collaboration-service'],
      taskKey: 'fixture_task',
      runTests: async (environmentForOwner) => {
        const collaboration = environmentForOwner('collaboration-service')
        const notification = environmentForOwner('notification-service')
        assert.equal(collaboration.EVENT_BUS_LIVE, 'true')
        assert.equal(collaboration.NATS_USER, 'collaboration')
        assert.match(collaboration.DATABASE_URL, /\/collaboration_test\?schema=public$/u)
        assert.equal(collaboration.COLLABORATION_DATABASE_URL, collaboration.DATABASE_URL)
        assert.equal(notification.NOTIFICATION_EVENT_LIVE_TEST, 'true')
        assert.equal(notification.NATS_USER, 'notification')
        assert.match(notification.DATABASE_URL, /\/notification_test\?schema=public$/u)
        assert.equal(notification.NOTIFICATION_DATABASE_URL, notification.DATABASE_URL)
        assert.equal(notification.COLLABORATION_DATABASE_URL, undefined)
        throw failure
      },
      adapters: {
        run(command, args) {
          commands.push([command, ...args])
          return ''
        },
        loadDatabaseContext() {
          return context
        },
        readState() {
          return { postgresPort: 55432 }
        },
        loadNatsEnvironment() {
          return {
            default: { NATS_URL: 'nats://fixture:4222' },
            collaboration: { NATS_URL: 'nats://fixture:4222', NATS_USER: 'collaboration' },
            notification: { NATS_URL: 'nats://fixture:4222', NATS_USER: 'notification' }
          }
        },
        bootstrapTaskTrust() {
          return { OES_GRPC_TLS_ENABLED: 'true' }
        },
        assertNoResidue() {
          residueChecked = true
        }
      }
    }),
    failure
  )

  assert.ok(commands.some((command) => command.join(' ') === 'pnpm db:up -- --profile integration'))
  assert.ok(
    commands.some(
      (command) =>
        command.join(' ') ===
        'pnpm db:migrate -- --services collaboration-service,notification-service'
    )
  )
  assert.deepEqual(commands.at(-1), ['pnpm', 'db:rollback'])
  assert.equal(residueChecked, true)
})
