import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const proto = readFileSync(join(__dirname, 'wms.proto'), 'utf8')

/** Locks WMS's 15-RPC BUSINESS surface and all 63 retired authority tombstones. */
describe('WMS trusted gRPC contract', () => {
  it('declares exactly the frozen 15 RPCs across four services', () => {
    expect(proto.match(/rpc \w+\(/gu) ?? []).toHaveLength(15)
    expect(serviceRpcCount('WarehouseQueryService')).toBe(4)
    expect(serviceRpcCount('ReceiptQueryService')).toBe(4)
    expect(serviceRpcCount('ReceiptManagementService')).toBe(4)
    expect(serviceRpcCount('InventoryQueryService')).toBe(3)
  })

  it('reserves all 55 request authority fields plus eight nested context fields', () => {
    expect(proto.match(/reserved 1, 2, 3;/gu) ?? []).toHaveLength(8)
    expect(proto.match(/reserved 1, 2;/gu) ?? []).toHaveLength(1)
    expect(proto.match(/reserved 1, 2, 3, 4;/gu) ?? []).toHaveLength(8)
    expect(proto.match(/reserved 1, 2, 3, 4, 5;/gu) ?? []).toHaveLength(1)
    expect(
      proto.match(/reserved "tenant_id", "operator_context", "trace_context";/gu) ?? []
    ).toHaveLength(6)
    expect(
      proto.match(/reserved "tenant_id", "operator_context", "trace_context", "org_id";/gu) ?? []
    ).toHaveLength(5)
    expect(
      proto.match(
        /reserved "tenant_id", "operator_context", "trace_context", "audit_context";/gu
      ) ?? []
    ).toHaveLength(3)
    expect(
      proto.match(
        /reserved "tenant_id", "org_id", "operator_context", "trace_context", "audit_context";/gu
      ) ?? []
    ).toHaveLength(1)
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

  it('preserves the first business field number for every request', () => {
    expect(firstFieldNumber('GetWarehouseRequest', 'warehouse_id')).toBe(4)
    expect(firstFieldNumber('ListWarehousesRequest', 'keyword')).toBe(5)
    expect(firstFieldNumber('GetLocationRequest', 'location_id')).toBe(4)
    expect(firstFieldNumber('ListLocationsRequest', 'warehouse_id')).toBe(4)
    expect(firstFieldNumber('GetReceiptRequest', 'receipt_id')).toBe(4)
    expect(firstFieldNumber('SearchReceiptsRequest', 'warehouse_id')).toBe(5)
    expect(firstFieldNumber('GetReceiptLineRequest', 'receipt_line_id')).toBe(4)
    expect(firstFieldNumber('SearchReceiptLinesRequest', 'receipt_id')).toBe(5)
    expect(firstFieldNumber('CreateReceiptDraftRequest', 'warehouse_id')).toBe(6)
    expect(firstFieldNumber('AddOrReplaceReceiptLinesRequest', 'receipt_id')).toBe(5)
    expect(firstFieldNumber('PostReceiptRequest', 'receipt_id')).toBe(5)
    expect(firstFieldNumber('CancelReceiptDraftRequest', 'receipt_id')).toBe(5)
    expect(firstFieldNumber('SearchStockLedgerEntriesRequest', 'warehouse_id')).toBe(5)
    expect(firstFieldNumber('GetInventoryBalanceRequest', 'warehouse_id')).toBe(4)
    expect(firstFieldNumber('SearchInventoryBalancesRequest', 'warehouse_id')).toBe(5)
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

/** Reads one frozen field number from a request message. */
function firstFieldNumber(messageName: string, fieldName: string): number {
  const match = messageBody(messageName).match(new RegExp(`\\b${fieldName} = (\\d+);`, 'u'))
  return Number(match?.[1] ?? -1)
}
