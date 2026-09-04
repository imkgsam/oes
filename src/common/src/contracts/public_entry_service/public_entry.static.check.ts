import { describe, it, test } from 'node:test'
import { expect } from '../../testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Verifies Public Entry removes all frozen request authority fields while preserving public projections. */
describe('Public Entry trusted gRPC contract', () => {
  const proto = readFileSync(resolve(__dirname, 'public_entry.proto'), 'utf8')

  it('reserves all 41 legacy request authority fields and the OperatorContext tombstone', () => {
    for (const field of ['tenant_id', 'operator_context', 'trace_id', 'account_id', 'operator_account_id', 'operator_org_id']) {
      expect(proto).toMatch(new RegExp(`reserved[^;]*"${field}"`))
    }
    expect(proto).toContain('reserved 1, 2, 3;')
    expect(proto).toContain('message BusinessCardRecord {\n  string business_card_id = 1;\n  string tenant_id = 2;')
  })

  it('keeps exactly the 23 existing RPC names and no authority-bearing request field definitions', () => {
    expect((proto.match(/^  rpc /gm) ?? [])).toHaveLength(23)
    expect(proto).not.toMatch(/^  string tenant_id = 1;$/m)
    expect(proto).not.toMatch(/^  OperatorContext operator_context = /m)
  })
})
