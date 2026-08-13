import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const proto = readFileSync(join(__dirname, 'mes.proto'), 'utf8')

/** Locks MES trusted RPC inventory, authority tombstones, bounded reasons, and nested compatibility reservations. */
describe('MES trusted gRPC contract', () => {
  it('declares exactly 32 RPCs and the fixed audience contract', () => {
    expect((proto.match(/rpc \w+\(/g) ?? []).length).toBe(32)
    expect(proto).toContain('service ProductionSpecManagementService')
    expect(proto).toContain('service MoldManagementService')
  })

  it('reserves request authority fields and nested compatibility fields', () => {
    expect((proto.match(/reserved 1, 2, 3, 4;/g) ?? []).length).toBe(32)
    expect((proto.match(/reserved 5;/g) ?? []).length).toBe(18)
    expect(proto).toContain('reserved "operator_id", "operator_type", "org_id"')
    expect(proto).toContain('reserved "trace_id", "request_id"')
    expect(proto).toContain('reserved "audit_id", "reason", "source"')
  })

  it('keeps capture-source tombstones and the sixteen reason field numbers', () => {
    expect(proto).toContain('reserved "capture_source"')
    expect((proto.match(/optional string reason =/g) ?? []).length).toBe(16)
    for (const field of ['reason = 14', 'reason = 13', 'reason = 10', 'reason = 11', 'reason = 21', 'reason = 16', 'reason = 9']) {
      expect(proto).toContain(field)
    }
  })
})
