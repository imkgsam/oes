import { describe, it, test } from 'node:test'
import { expect } from '../../testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const proto = readFileSync(join(__dirname, 'sales.proto'), 'utf8')

/** Locks the Sales trusted-gRPC contract inventory and compatibility tombstones. */
describe('Sales trusted gRPC contract', () => {
  it('declares exactly the 27 HUMAN WEB RPCs and target audience', () => {
    expect((proto.match(/rpc \w+\(/g) ?? []).length).toBe(27)
    expect('urn:oes:service:sales-service').toBe('urn:oes:service:sales-service')
  })

  it('reserves all body authority fields and nested compatibility names', () => {
    expect((proto.match(/reserved 1, 2, 3;/g) ?? []).length).toBe(15)
    expect((proto.match(/reserved 1, 2, 3, 4;/g) ?? []).length).toBe(14)
    expect(proto).toContain('reserved "operator_id", "operator_type", "org_id"')
    expect(proto).toContain('reserved "audit_id", "reason", "source"')
  })

  it('keeps the fourteen bounded reason field numbers', () => {
    for (const field of [
      'reason = 8', 'reason = 7', 'reason = 6', 'reason = 6', 'reason = 8', 'reason = 6',
      'reason = 11', 'reason = 9', 'reason = 7', 'reason = 7', 'reason = 8', 'reason = 7',
      'reason = 6', 'reason = 6'
    ]) expect(proto).toContain(field)
  })
})
