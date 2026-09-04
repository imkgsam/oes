import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Gateway Permission trusted channel binding', () => {
  const source = readFileSync(join(__dirname, '../../app.module.ts'), 'utf8')

  it('binds the global Permission guard token to the exact mTLS trusted client', () => {
    expect(source).toContain('provide: getGrpcClientToken(SERVICE_NAMES.PERMISSION)')
    expect(source).toContain('useFactory: (client: TrustedPermissionGrpcClient) => client.getClient()')
    expect(source).toContain('inject: [TrustedPermissionGrpcClient]')
  })

  it('does not shadow the trusted binding with the legacy pooled Permission client', () => {
    expect(source).not.toContain('GrpcTransportModule.forFeature([SERVICE_NAMES.PERMISSION])')
  })
})
