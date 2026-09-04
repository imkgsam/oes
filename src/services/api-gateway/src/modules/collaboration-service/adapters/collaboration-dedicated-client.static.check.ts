import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { expect } from '../../../../../../common/src/testing/static-check-assertions.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** Rejects the retired generic Collaboration transport while preserving dedicated client wiring. */
describe('Collaboration dedicated client structure', () => {
  it('uses only the dedicated Collaboration client', () => {
    const gatewayRoot = resolve(__dirname, '../../../app.module.ts')
    const featureModule = resolve(__dirname, '../collaboration-service.module.ts')
    const source = [readFileSync(gatewayRoot, 'utf8'), readFileSync(featureModule, 'utf8')].join('\n')
    expect(source).not.toContain('SERVICE_NAMES.COLLABORATION')
    expect(source).not.toContain('resolveCollaborationGrpcUrl')
    expect(source).toContain('GatewayCollaborationGrpcClient')
  })
})
