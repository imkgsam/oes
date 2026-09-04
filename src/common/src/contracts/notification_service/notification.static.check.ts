import { describe, it, test } from 'node:test'
import { expect } from '../../testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Guards the frozen wire tombstones so request bodies can never regain dispatch authority. */
describe('notification trusted dispatch wire contract', () => {
  const proto = readFileSync(resolve(__dirname, 'notification.proto'), 'utf8')
  it('reserves SourceContext identity fields and both legacy source fields', () => {
    expect(proto).toContain('reserved 1, 2, 3, 4, 5;')
    expect(proto).toContain('reserved "source_service", "tenant_id", "org_id", "trace_id", "request_id";')
    expect((proto.match(/reserved 1;\n  reserved "source";/g) ?? [])).toHaveLength(2)
  })
})
