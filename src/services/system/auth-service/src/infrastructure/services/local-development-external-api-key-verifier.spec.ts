import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LocalDevelopmentExternalApiKeyVerifier } from './local-development-external-api-key-verifier'

const identifier = Buffer.alloc(18, 1).toString('base64url')
const secret = Buffer.alloc(32, 2).toString('base64url')

/** Proves the software verifier stays confined to an explicit strong-key development profile. */
describe('LocalDevelopmentExternalApiKeyVerifier', () => {
  it('accepts only the explicit development profile with a 256-bit owner-readable key', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'oes-api-key-verifier-'))
    const strongKeyPath = join(directory, 'strong.key')
    const weakKeyPath = join(directory, 'weak.key')
    writeFileSync(strongKeyPath, Buffer.alloc(32, 7), { mode: 0o600 })
    writeFileSync(weakKeyPath, Buffer.alloc(16, 7), { mode: 0o600 })

    try {
      const enabled = new LocalDevelopmentExternalApiKeyVerifier(
        'development',
        'local-development',
        strongKeyPath,
        'local-v1'
      )
      await expect(enabled.compute({ mode: 'ISSUE', identifier, secret })).resolves.toMatchObject({
        verifierKeyVersion: 'local-v1'
      })

      await expect(
        new LocalDevelopmentExternalApiKeyVerifier(
          'production',
          'local-development',
          strongKeyPath,
          'local-v1'
        ).getStatus()
      ).rejects.toThrow('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')

      await expect(
        new LocalDevelopmentExternalApiKeyVerifier(
          'development',
          'local-development',
          weakKeyPath,
          'local-v1'
        ).compute({ mode: 'ISSUE', identifier, secret })
      ).rejects.toThrow('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
