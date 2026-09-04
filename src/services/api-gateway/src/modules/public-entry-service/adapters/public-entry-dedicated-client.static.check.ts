import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { expect } from '../../../../../../common/src/testing/static-check-assertions.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** Rejects legacy generic Public Entry client registration in every dedicated adapter owner. */
describe('Public Entry dedicated mTLS client structure', () => {
  it('contains no legacy client injection or generic feature registration', () => {
    const root = resolve(__dirname, '..')
    for (const file of [
      resolve(root, 'adapters/public-entry-short-link-grpc.adapter.ts'),
      resolve(root, 'adapters/public-entry-business-card-grpc.adapter.ts'),
      resolve(root, 'public-entry-service.module.ts')
    ]) {
      const source = readFileSync(file, 'utf8')
      expect(source).not.toContain('InjectGrpcClient(SERVICE_NAMES.PUBLIC_ENTRY)')
      expect(source).not.toContain('GrpcTransportModule.forFeature([SERVICE_NAMES.PUBLIC_ENTRY')
    }
  })
})
