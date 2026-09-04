import { describe, it, test } from 'node:test'
import { expect } from '../../testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const proto = readFileSync(join(__dirname, 'item_master.proto'), 'utf8')

/** Locks Item Master's trusted RPC inventory and deleted request-authority tombstones. */
describe('Item Master trusted gRPC contract', () => {
  it('declares exactly 53 RPCs split across query, management, and internal qualification', () => {
    expect(proto.match(/rpc \w+\(/gu) ?? []).toHaveLength(53)
    expect(serviceRpcCount('ItemMasterQueryService')).toBe(19)
    expect(serviceRpcCount('ItemMasterManagementService')).toBe(31)
    expect(serviceRpcCount('ItemMasterInternalQueryService')).toBe(3)
  })

  it('reserves the retired tenant body authority on all 50 HUMAN requests', () => {
    expect(proto.match(/reserved 1;/gu) ?? []).toHaveLength(50)
    expect(proto.match(/reserved "tenant_id";/gu) ?? []).toHaveLength(50)
    expect(proto.match(/\btenant_id\s*=/gu) ?? []).toHaveLength(0)
  })
})

/** Counts RPC declarations inside one proto service block. */
function serviceRpcCount(serviceName: string): number {
  const body =
    proto.match(new RegExp(`service ${serviceName} \\{([\\s\\S]*?)\\n\\}`, 'u'))?.[1] ?? ''
  return (body.match(/rpc \w+\(/gu) ?? []).length
}
