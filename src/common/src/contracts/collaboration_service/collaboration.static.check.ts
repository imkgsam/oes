import { describe, it, test } from 'node:test'
import { expect } from '../../testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('collaboration trusted gRPC contract', () => {
  const proto = readFileSync(resolve(__dirname, 'collaboration.proto'), 'utf8')

  it('keeps the closed 16-RPC surface and authority tombstones', () => {
    const rpcCount = [...proto.matchAll(/\brpc\s+\w+\(/g)].length
    expect(rpcCount).toBe(16)
    expect(proto).toContain('reserved "tenant_id", "operator_context", "trace_context", "audit_context";')
    expect(proto).toContain('message OperatorContext {\n  reserved 1 to 4;')
    expect(proto).toContain('message TraceContext {\n  reserved 1 to 2;')
    expect(proto).toContain('message AuditContext {\n  reserved 1 to 3;')
  })
})
