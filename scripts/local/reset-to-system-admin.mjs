#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const DEFAULT_POSTGRES_ADMIN_URL = 'postgres://imkgsam:imkgsam@localhost:5432/postgres'
const DEFAULT_POSTGRES_CONTAINER = 'oes_postgres'
const DEFAULT_DATABASES = [
  'permissiondb',
  'identitydb',
  'hrdb',
  'authdb',
  'assetdb',
  'partydb',
  'tenantorgdb',
  'itemmasterdb',
  'notificationdb',
  'salesdb',
  'crmdb',
  'mydb'
]

const SYSTEM_ADMIN_SEED_URLS = {
  OES_PARTY_DATABASE_URL: 'postgres://imkgsam:imkgsam@127.0.0.1:5432/partydb',
  OES_IDENTITY_DATABASE_URL: 'postgres://imkgsam:imkgsam@127.0.0.1:5432/identitydb',
  OES_AUTH_DATABASE_URL: 'postgres://imkgsam:imkgsam@127.0.0.1:5432/authdb',
  OES_PERMISSION_DATABASE_URL: 'postgres://imkgsam:imkgsam@127.0.0.1:5432/permissiondb'
}

/** parseResetToSystemAdminArgs keeps destructive reset explicit unless package.json chooses --apply. */
export function parseResetToSystemAdminArgs(args) {
  return {
    apply: args.includes('--apply'),
    help: args.includes('--help') || args.includes('-h')
  }
}

/** buildSystemAdminSeedEnv pins seed Prisma clients to 127.0.0.1 for local Docker port forwarding. */
export function buildSystemAdminSeedEnv(env = process.env) {
  return {
    OES_PARTY_DATABASE_URL: env.OES_PARTY_DATABASE_URL ?? env.PARTY_DATABASE_URL ?? SYSTEM_ADMIN_SEED_URLS.OES_PARTY_DATABASE_URL,
    OES_IDENTITY_DATABASE_URL: env.OES_IDENTITY_DATABASE_URL ?? env.IDENTITY_DATABASE_URL ?? SYSTEM_ADMIN_SEED_URLS.OES_IDENTITY_DATABASE_URL,
    OES_AUTH_DATABASE_URL: env.OES_AUTH_DATABASE_URL ?? env.AUTH_DATABASE_URL ?? SYSTEM_ADMIN_SEED_URLS.OES_AUTH_DATABASE_URL,
    OES_PERMISSION_DATABASE_URL: env.OES_PERMISSION_DATABASE_URL ?? env.PERMISSION_DATABASE_URL ?? SYSTEM_ADMIN_SEED_URLS.OES_PERMISSION_DATABASE_URL
  }
}

/** buildResetToSystemAdminPlan renders the reset target and command sequence without exposing secrets. */
export function buildResetToSystemAdminPlan(env = process.env, options = parseResetToSystemAdminArgs([])) {
  const postgresAdminUrl = env.OES_POSTGRES_ADMIN_DATABASE_URL ?? env.POSTGRES_ADMIN_DATABASE_URL ?? DEFAULT_POSTGRES_ADMIN_URL
  const postgres = parsePostgresAdminUrl(postgresAdminUrl)
  const container = env.OES_POSTGRES_CONTAINER ?? env.POSTGRES_CONTAINER ?? DEFAULT_POSTGRES_CONTAINER
  const databases = parseDatabaseList(env.OES_RESET_DATABASES ?? env.RESET_DATABASES)

  return {
    mode: options.apply ? 'apply' : 'dry-run',
    writesDatabase: Boolean(options.apply),
    postgres: {
      container,
      host: postgres.host,
      port: postgres.port,
      user: postgres.user,
      url: maskDatabaseUrl(postgresAdminUrl)
    },
    databases,
    steps: [
      { name: 'reset-postgres-databases', command: `docker exec ${container} dropdb/createdb` },
      { name: 'sync-backend-schemas', command: 'pnpm backend:db:sync' },
      { name: 'deploy-notification-migrations', command: 'pnpm --filter notification-service prisma:migrate:deploy' },
      { name: 'sync-permission-foundation', command: 'pnpm backend:foundation:sync' },
      { name: 'validate-permission-foundation', command: 'pnpm --filter permission-service seed:apply -- --validate' },
      { name: 'seed-system-admin', command: 'pnpm seed:system-admin -- --apply' },
      { name: 'validate-system-admin', command: 'pnpm seed:system-admin -- --validate' }
    ]
  }
}

/** resetPostgresDatabases drops and recreates the configured local service databases inside the Postgres container. */
export function resetPostgresDatabases(plan, env = process.env) {
  const postgresAdminUrl = env.OES_POSTGRES_ADMIN_DATABASE_URL ?? env.POSTGRES_ADMIN_DATABASE_URL ?? DEFAULT_POSTGRES_ADMIN_URL
  const postgres = parsePostgresAdminUrl(postgresAdminUrl)
  const databaseArgs = plan.databases.map((database) => shellQuote(database)).join(' ')
  const shellScript = [
    'set -eu',
    `for db in ${databaseArgs}; do`,
    '  echo "resetting:${db}"',
    `  dropdb -h localhost -U ${shellQuote(postgres.user)} --if-exists --force "$db"`,
    `  createdb -h localhost -U ${shellQuote(postgres.user)} -O ${shellQuote(postgres.user)} "$db"`,
    'done'
  ].join('\n')

  runCommand('docker', [
    'exec',
    '-e',
    'PGPASSWORD',
    plan.postgres.container,
    'sh',
    '-lc',
    shellScript
  ], {
    env: {
      ...process.env,
      PGPASSWORD: postgres.password
    },
    label: 'reset-postgres-databases'
  })
}

/** runResetToSystemAdmin executes the local reset/sync/seed sequence used to restore a sysadmin-only state. */
export function runResetToSystemAdmin(env = process.env, args = process.argv.slice(2)) {
  const options = parseResetToSystemAdminArgs(args)
  const plan = buildResetToSystemAdminPlan(env, options)

  if (options.help) {
    printHelp(plan)
    return
  }

  console.log(JSON.stringify(plan, null, 2))
  if (!options.apply) {
    console.log('\nDry-run only. Run `pnpm reset:sysadmin` or add `--apply` to execute.')
    return
  }

  validateResetPlan(plan)
  resetPostgresDatabases(plan, env)
  runCommand('pnpm', ['backend:db:sync'], { label: 'sync-backend-schemas' })
  runCommand('pnpm', ['--filter', 'notification-service', 'prisma:migrate:deploy'], { label: 'deploy-notification-migrations' })
  runCommand('pnpm', ['backend:foundation:sync'], { label: 'sync-permission-foundation' })
  runCommand('pnpm', ['--filter', 'permission-service', 'seed:apply', '--', '--validate'], { label: 'validate-permission-foundation' })

  const seedEnv = {
    ...process.env,
    ...buildSystemAdminSeedEnv(env)
  }
  runCommand('pnpm', ['seed:system-admin', '--', '--apply'], {
    env: seedEnv,
    label: 'seed-system-admin'
  })
  runCommand('pnpm', ['seed:system-admin', '--', '--validate'], {
    env: seedEnv,
    label: 'validate-system-admin'
  })
}

/** validateResetPlan rejects non-local or malformed database reset targets before destructive actions. */
function validateResetPlan(plan) {
  if (plan.postgres.container !== DEFAULT_POSTGRES_CONTAINER && !/^[a-zA-Z0-9_.-]+$/.test(plan.postgres.container)) {
    throw new Error(`Invalid postgres container name: ${plan.postgres.container}`)
  }

  for (const database of plan.databases) {
    if (!/^[a-zA-Z0-9_]+$/.test(database)) {
      throw new Error(`Invalid database name: ${database}`)
    }
  }
}

function parsePostgresAdminUrl(value) {
  const parsed = new URL(value)
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('Postgres admin URL must use postgres:// or postgresql://')
  }
  if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
    throw new Error(`Postgres admin URL must target localhost, got ${parsed.hostname}`)
  }
  return {
    host: parsed.hostname,
    password: decodeURIComponent(parsed.password),
    port: parsed.port || '5432',
    user: decodeURIComponent(parsed.username)
  }
}

function parseDatabaseList(value) {
  const databases = value?.split(',').map((item) => item.trim()).filter(Boolean) ?? []
  return [...new Set(databases.length ? databases : DEFAULT_DATABASES)]
}

function maskDatabaseUrl(value) {
  try {
    const parsed = new URL(value)
    if (parsed.password) {
      parsed.password = '***'
    }
    return parsed.toString()
  } catch {
    return '(invalid database url)'
  }
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`
}

function runCommand(command, args, options = {}) {
  console.log(`\n> ${options.label ?? [command, ...args].join(' ')}`)
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: options.env ?? process.env,
    stdio: 'inherit'
  })
  if (result.status !== 0) {
    throw new Error(`${options.label ?? command} failed with status ${result.status}`)
  }
}

function printHelp(plan) {
  console.log(`Reset local OES databases and restore the sysadmin seed.

Usage:
  pnpm reset:sysadmin
  node scripts/local/reset-to-system-admin.mjs --apply

Environment overrides:
  OES_POSTGRES_CONTAINER          default: ${plan.postgres.container}
  OES_POSTGRES_ADMIN_DATABASE_URL default: ${plan.postgres.url}
  OES_RESET_DATABASES             comma-separated database list
`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    runResetToSystemAdmin()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}
