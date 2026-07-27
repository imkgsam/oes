import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Guards generated gRPC surfaces so every RPC explicitly accepts trusted metadata. */
describe('Buf gRPC metadata generation', () => {
  it('enables explicit Metadata parameters in ts-proto output', () => {
    const config = readFileSync(join(__dirname, 'buf.gen.yaml'), 'utf8')

    expect(config).toContain('- addGrpcMetadata=true')
  })
})
