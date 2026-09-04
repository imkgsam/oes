import { describe, it, test } from 'node:test'
import { expect } from '../../testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const proto = readFileSync(join(__dirname, 'procurement.proto'), 'utf8')

/** Locks Procurement's 22-RPC trusted surface, 90 tombstones, and narrow WMS projection. */
describe('Procurement trusted gRPC contract', () => {
  it('declares exactly 21 BUSINESS RPCs and one narrow INTERNAL receipt query', () => {
    expect(proto.match(/rpc \w+\(/gu) ?? []).toHaveLength(22)
    expect(serviceRpcCount('PurchaseRequestQueryService')).toBe(2)
    expect(serviceRpcCount('PurchaseRequestManagementService')).toBe(6)
    expect(serviceRpcCount('PurchaseOrderQueryService')).toBe(3)
    expect(serviceRpcCount('PurchaseOrderManagementService')).toBe(6)
    expect(serviceRpcCount('ReceivingExpectationQueryService')).toBe(2)
    expect(serviceRpcCount('ReceivingExpectationManagementService')).toBe(2)
    expect(serviceRpcCount('ProcurementInternalQueryService')).toBe(1)
  })

  it('reserves all 82 request authority fields plus eight nested context fields', () => {
    expect(proto.match(/reserved 1, 2, 3;/gu) ?? []).toHaveLength(6)
    expect(proto.match(/reserved 1, 2;/gu) ?? []).toHaveLength(1)
    expect(proto.match(/reserved 1, 2, 3, 4;/gu) ?? []).toHaveLength(15)
    expect(proto.match(/reserved 1, 2, 3, 4, 5;/gu) ?? []).toHaveLength(2)
    expect(
      proto.match(/reserved "tenant_id", "operator_context", "trace_context";/gu) ?? []
    ).toHaveLength(4)
    expect(
      proto.match(/reserved "tenant_id", "operator_context", "trace_context", "org_id";/gu) ?? []
    ).toHaveLength(3)
    expect(
      proto.match(
        /reserved "tenant_id", "operator_context", "trace_context", "audit_context";/gu
      ) ?? []
    ).toHaveLength(12)
    expect(
      proto.match(
        /reserved "tenant_id", "operator_context", "trace_context", "audit_context", "org_id";/gu
      ) ?? []
    ).toHaveLength(2)
    expect(messageBody('OperatorContext')).toMatch(
      /^\s*reserved 1, 2, 3;\s*reserved "operator_id", "operator_type", "org_id";\s*$/u
    )
    expect(messageBody('TraceContext')).toMatch(
      /^\s*reserved 1, 2;\s*reserved "trace_id", "request_id";\s*$/u
    )
    expect(messageBody('AuditContext')).toMatch(
      /^\s*reserved 1, 2, 3;\s*reserved "audit_id", "reason", "source";\s*$/u
    )
  })

  it('keeps the WMS INTERNAL request and six-field response authority-free', () => {
    expect(messageBody('ResolveReceivingExpectationForReceiptRequest')).toMatch(
      /^\s*string receiving_expectation_id = 1;\s*$/u
    )
    expect(messageBody('ResolveReceivingExpectationForReceiptResponse')).toMatch(
      /^\s*string receiving_expectation_id = 1;\s*string purchase_order_id = 2;\s*string purchase_order_line_id = 3;\s*string target_warehouse_id = 4;\s*string open_quantity = 5;\s*ReceivingExpectationStatus status = 6;\s*$/u
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
