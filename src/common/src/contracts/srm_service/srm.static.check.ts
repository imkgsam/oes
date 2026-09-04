import { describe, it, test } from 'node:test'
import { expect } from '../../testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const proto = readFileSync(join(__dirname, 'srm.proto'), 'utf8')

/** Locks SRM's 15-RPC trusted surface and all retired request-authority tombstones. */
describe('SRM trusted gRPC contract', () => {
  it('declares exactly 13 BUSINESS RPCs and two narrow INTERNAL eligibility RPCs', () => {
    expect(proto.match(/rpc \w+\(/gu) ?? []).toHaveLength(15)
    expect(serviceRpcCount('SupplierQueryService')).toBe(6)
    expect(serviceRpcCount('SupplierManagementService')).toBe(7)
    expect(serviceRpcCount('SrmInternalQueryService')).toBe(2)
  })

  it('reserves all 46 retired authority field numbers and names across the 13 BUSINESS requests', () => {
    expect(proto.match(/reserved 1, 2, 3;/gu) ?? []).toHaveLength(6)
    expect(proto.match(/reserved 1, 2, 3, 4;/gu) ?? []).toHaveLength(7)
    expect(
      proto.match(/reserved "tenant_id", "operator_context", "trace_context";/gu) ?? []
    ).toHaveLength(6)
    expect(
      proto.match(
        /reserved "tenant_id", "operator_context", "trace_context", "audit_context";/gu
      ) ?? []
    ).toHaveLength(7)
    expect(proto).not.toMatch(/message (OperatorContext|TraceContext|AuditContext)\s*\{/u)
  })

  it('keeps the INTERNAL request and response projections narrow and authority-free', () => {
    expect(messageBody('ResolveActiveSupplierRequest')).toMatch(/^\s*string supplier_id = 1;\s*$/u)
    expect(messageBody('ResolveActiveSupplierResponse')).toContain('string supplier_id = 1;')
    expect(messageBody('ResolveActiveSupplierResponse')).toContain('string display_name = 2;')
    expect(messageBody('ResolveActiveSupplierResponse')).toContain('SupplierStatus status = 3;')
    expect(messageBody('ResolveActiveSupplierOfferingRequest')).toMatch(
      /^\s*string supplier_id = 1;\s*string item_id = 2;\s*$/u
    )
    expect(messageBody('ResolveActiveSupplierOfferingResponse')).not.toMatch(
      /price|moq|lead_time|terms|tenant_id|operator_context|trace_context|audit_context/iu
    )
  })
})

/** Counts RPC declarations inside one proto service block. */
function serviceRpcCount(serviceName: string): number {
  const body =
    proto.match(new RegExp(`service ${serviceName} \\{([\\s\\S]*?)\\n\\}`, 'u'))?.[1] ?? ''
  return (body.match(/rpc \w+\(/gu) ?? []).length
}

/** Returns one exact proto message body for field-level contract assertions. */
function messageBody(messageName: string): string {
  return proto.match(new RegExp(`message ${messageName} \\{([\\s\\S]*?)\\n\\}`, 'u'))?.[1] ?? ''
}
