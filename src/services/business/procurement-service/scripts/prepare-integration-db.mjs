import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SERVICE_ROOT = path.resolve(__dirname, '..')
const TEST_SCHEMA = 'procurement_service_integration'
const POSTGRES_CONTAINER = 'oes_postgres'

/** parseEnvValue removes optional quotes from one dotenv scalar value. */
function parseEnvValue(raw) {
  const trimmed = raw.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

/** loadBaseDatabaseUrl reads DATABASE_URL from env or local .env so the Integration schema can be derived deterministically. */
function loadBaseDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const envPath = path.join(SERVICE_ROOT, '.env')
  if (!existsSync(envPath)) {
    throw new Error(`DATABASE_URL is not set and .env was not found at ${envPath}`)
  }

  const envContent = readFileSync(envPath, 'utf8')
  const match = envContent.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m)
  if (!match) {
    throw new Error(`DATABASE_URL was not found in ${envPath}`)
  }

  return parseEnvValue(match[1])
}

/** buildIntegrationDatabaseUrl rewrites the schema query parameter so Integration only touches its dedicated test schema. */
function buildIntegrationDatabaseUrl() {
  const parsed = new URL(loadBaseDatabaseUrl())
  parsed.searchParams.set('schema', TEST_SCHEMA)
  return parsed.toString()
}

/** splitSqlStatements turns the generated diff script into executable PostgreSQL statements for Prisma raw execution. */
function splitSqlStatements(script) {
  return script.replace(/^--.*$/gm, '').trim()
}

/** buildBootstrapSql recreates the dedicated test schema before replaying the generated Prisma DDL into PostgreSQL. */
function buildBootstrapSql(schemaScript) {
  return [
    `DROP SCHEMA IF EXISTS "${TEST_SCHEMA}" CASCADE;`,
    `CREATE SCHEMA "${TEST_SCHEMA}";`,
    `SET search_path TO "${TEST_SCHEMA}";`,
    splitSqlStatements(schemaScript)
  ]
    .filter((statement) => statement.length > 0)
    .join('\n')
}

/** applyBootstrapSql replays the generated DDL through psql inside the local PostgreSQL infra container. */
function applyBootstrapSql(databaseUrl, bootstrapSql) {
  const parsed = new URL(databaseUrl)
  const username = decodeURIComponent(parsed.username)
  const password = decodeURIComponent(parsed.password)
  const databaseName = parsed.pathname.replace(/^\//, '')

  execFileSync(
    'docker',
    [
      'exec',
      '-i',
      '-e',
      `PGPASSWORD=${password}`,
      POSTGRES_CONTAINER,
      'psql',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      username,
      '-d',
      databaseName
    ],
    {
      input: bootstrapSql,
      encoding: 'utf8',
      stdio: ['pipe', 'inherit', 'inherit']
    }
  )
}

/** prepareIntegrationDatabase recreates the dedicated test schema from the Prisma datamodel without non-migration schema mutation. */
async function prepareIntegrationDatabase() {
  const databaseUrl = buildIntegrationDatabaseUrl()
  process.env.DATABASE_URL = databaseUrl

  const schemaScript = execFileSync(
    'npx',
    ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', './prisma/schema.prisma', '--script'],
    {
      cwd: SERVICE_ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl
      }
    }
  )

  applyBootstrapSql(databaseUrl, buildBootstrapSql(schemaScript))
}

await prepareIntegrationDatabase()
