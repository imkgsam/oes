import { spawnSync } from 'node:child_process'

const DEFAULT_LOCAL_DATABASE_URL = 'postgres://imkgsam:imkgsam@localhost:5432/collaborationdb'

/** withCollaborationSchema returns a DATABASE_URL scoped to collaboration-service storage. */
function withCollaborationSchema(rawUrl) {
  const parsed = new URL(rawUrl)
  if (!parsed.searchParams.get('schema')) {
    parsed.searchParams.set('schema', 'collaboration_service')
  }
  return parsed.toString()
}

const rawDatabaseUrl =
  process.env.COLLABORATION_DATABASE_URL ||
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV !== 'production' ? DEFAULT_LOCAL_DATABASE_URL : '')

if (!rawDatabaseUrl) {
  console.error(
    'COLLABORATION_DATABASE_URL or DATABASE_URL is required for production collaboration-service Prisma commands.'
  )
  process.exit(1)
}

const result = spawnSync('npx', ['prisma', ...process.argv.slice(2)], {
  env: {
    ...process.env,
    DATABASE_URL: withCollaborationSchema(rawDatabaseUrl)
  },
  stdio: 'inherit'
})

process.exit(result.status ?? 1)
