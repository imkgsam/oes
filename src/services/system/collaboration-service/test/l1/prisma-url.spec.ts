import { resolvePrismaClientOptions } from '../../src/infrastructure/prisma/prisma.service'
import { ensureIntegrationDatabaseUrl } from '../helpers/integration-db'

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

    expect(url).toContain('postgres://imkgsam:imkgsam@localhost:5432/mydb')
    expect(url).toContain('schema=collaboration_service')
  })

  it('preserves an explicit database URL while adding the collaboration schema when missing', () => {
    process.env.COLLABORATION_DATABASE_URL = 'postgres://user:pass@127.0.0.1:5432/customdb'

    const options = resolvePrismaClientOptions()

    expect(options?.datasources?.db?.url).toBe(
      'postgres://user:pass@127.0.0.1:5432/customdb?schema=collaboration_service'
    )
  })

  it('keeps L2 integration tests aligned with the local runtime fallback URL', () => {
    delete process.env.COLLABORATION_DATABASE_URL
    delete process.env.DATABASE_URL
    process.env.NODE_ENV = 'development'

    const url = ensureIntegrationDatabaseUrl()

    expect(url).toContain('postgres://imkgsam:imkgsam@localhost:5432/mydb')
    expect(url).toContain('schema=collaboration_service')
  })
})
