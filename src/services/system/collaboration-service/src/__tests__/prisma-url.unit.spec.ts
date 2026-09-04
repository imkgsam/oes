import { resolvePrismaClientOptions } from '../infrastructure/prisma/prisma.service'
import { ensureIntegrationDatabaseUrl } from '../../test/helpers/integration-db'

const ORIGINAL_ENV = { ...process.env }

// Verifies local collaboration-service runtime remains bootable even without a gitignored .env file.
describe('collaboration-service prisma URL resolution', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('uses a local development database fallback scoped to collaboration_service schema', () => {
    delete process.env.COLLABORATION_DATABASE_URL
    delete process.env.DATABASE_URL
    process.env.NODE_ENV = 'development'

    const options = resolvePrismaClientOptions()
    const url = options?.datasources?.db?.url

    expect(url).toContain('postgres://imkgsam:imkgsam@localhost:5432/collaborationdb')
    expect(url).toContain('schema=collaboration_service')
  })

  it('preserves an explicit database URL while adding the collaboration schema when missing', () => {
    process.env.COLLABORATION_DATABASE_URL = 'postgres://user:pass@127.0.0.1:5432/customdb'

    const options = resolvePrismaClientOptions()

    expect(options?.datasources?.db?.url).toBe(
      'postgres://user:pass@127.0.0.1:5432/customdb?schema=collaboration_service'
    )
  })

  it('keeps Integration integration tests aligned with the task-owned service database URL', () => {
    delete process.env.COLLABORATION_DATABASE_URL
    delete process.env.DATABASE_URL
    process.env.NODE_ENV = 'development'

    const url = ensureIntegrationDatabaseUrl()

    const parsed = new URL(url)
    expect(parsed.hostname).toBe('127.0.0.1')
    expect(parsed.pathname).toMatch(/^\/oes_[a-z0-9_]+_collaboration$/)
    expect(parsed.searchParams.get('schema')).toBe('public')
  })
})
