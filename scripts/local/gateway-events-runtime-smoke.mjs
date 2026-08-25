import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnvironmentFile } from './worktree-env.mjs'

/** Owns the reproducible task-local infrastructure lifecycle for the combined event route proof. */
function main() {
  const root = resolve(import.meta.dirname, '../..')
  let started = false
  try {
    run('pnpm', ['db:up'], root)
    started = true
    run('pnpm', ['db:migrate'], root)
    run('pnpm', ['generated:all'], root)
    run('pnpm', ['common:build'], root)
    run('pnpm', ['--filter', 'collaboration-service', 'build'], root)
    run('pnpm', ['--filter', 'notification-service', 'build'], root)
    const local = runtimeEnvironment(root)
    run('node', ['scripts/local/gateway-events-event-route-live.mjs'], root, {
      ...process.env,
      ...local
    })
    run('pnpm', ['gateway:apisix:smoke'], root)
  } finally {
    if (started) run('pnpm', ['db:rollback'], root)
  }
}

/** Resolves loopback ports without printing or persisting any generated task credential. */
function runtimeEnvironment(root) {
  const rootEnvironment = parseEnvironmentFile(readFileSync(`${root}/.env`, 'utf8'))
  const taskKey = rootEnvironment.get('OES_TASK_KEY')
  const stateDirectory = `${root}/.tmp/oes-database-lifecycle/${taskKey}`
  const composeEnvironment = parseEnvironmentFile(
    readFileSync(`${stateDirectory}/compose.env`, 'utf8')
  )
  const state = JSON.parse(readFileSync(`${stateDirectory}/state.json`, 'utf8'))
  const natsPort = publishedPort(
    root,
    state.projectName,
    `${stateDirectory}/compose.env`,
    'nats',
    4222
  )
  const hostDatabaseUrl = (key) => {
    const url = new URL(composeEnvironment.get(key))
    url.hostname = '127.0.0.1'
    url.port = String(state.postgresPort)
    return url.toString()
  }
  return {
    OES_TASK_KEY: taskKey,
    COLLABORATION_DATABASE_URL: hostDatabaseUrl('OES_DB_COLLABORATION_SERVICE_URL'),
    NOTIFICATION_DATABASE_URL: hostDatabaseUrl('OES_DB_NOTIFICATION_SERVICE_URL'),
    NATS_URL: `nats://127.0.0.1:${natsPort}`,
    NATS_COLLABORATION_USER: composeEnvironment.get('NATS_COLLABORATION_USER'),
    NATS_COLLABORATION_PASSWORD: composeEnvironment.get('NATS_COLLABORATION_PASSWORD'),
    NATS_NOTIFICATION_USER: composeEnvironment.get('NATS_NOTIFICATION_USER'),
    NATS_NOTIFICATION_PASSWORD: composeEnvironment.get('NATS_NOTIFICATION_PASSWORD'),
    NATS_NOTIFICATION_REPLAY_USER: composeEnvironment.get('NATS_NOTIFICATION_REPLAY_USER'),
    NATS_NOTIFICATION_REPLAY_PASSWORD: composeEnvironment.get('NATS_NOTIFICATION_REPLAY_PASSWORD')
  }
}

/** Reads one task-owned random Compose port without exposing any connection credential. */
function publishedPort(root, projectName, environmentPath, service, containerPort) {
  const result = spawnSync(
    'docker',
    [
      'compose',
      '--env-file',
      environmentPath,
      '--project-name',
      projectName,
      '-f',
      'docker-compose.infra.yml',
      'port',
      service,
      String(containerPort)
    ],
    { cwd: root, encoding: 'utf8' }
  )
  if (result.status !== 0) throw new Error(`GATEWAY_EVENTS_PORT_LOOKUP_FAILED:${service}`)
  const match = result.stdout.trim().match(/:(\d+)$/)
  if (!match) throw new Error(`GATEWAY_EVENTS_PORT_OUTPUT_INVALID:${service}`)
  return Number(match[1])
}

/** Executes one literal lifecycle step and propagates its exit status without serializing environment values. */
function run(command, arguments_, root, environment = process.env) {
  process.stdout.write(`COMMAND ${command} ${arguments_.join(' ')}\n`)
  const result = spawnSync(command, arguments_, { cwd: root, env: environment, stdio: 'inherit' })
  process.stdout.write(`EXIT status=${result.status ?? 'spawn-error'}\n`)
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`GATEWAY_EVENTS_COMMAND_FAILED:${command}`)
}

main()
