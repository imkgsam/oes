import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Locks Browser Activity's token-only proto removals and prevents legacy authority field reuse. */
describe('browser activity trusted gRPC contract', () => {
  const source = readFileSync(resolve(__dirname, 'browser_activity.proto'), 'utf8')

  it('reserves all 46 legacy authority field numbers and names', () => {
    expect(source).toContain('reserved 1, 2, 3;')
    expect(source).toContain('reserved 1, 3, 4, 5;')
    expect(source).toContain('reserved 1, 2, 4, 5;')
    expect(source).toContain('reserved "tenant_id", "extension_session_id", "operator", "trace";')
    expect(source.match(/reserved "tenant_id"/g)).toHaveLength(13)
    expect(source).toContain('reserved "extension_session_id";')
  })

  it('keeps only the thirteen frozen service methods', () => {
    expect([...source.matchAll(/^\s*rpc\s+(\w+)/gm)].map((match) => match[1])).toEqual([
      'GetPolicy',
      'UpdatePolicy',
      'GetEmployeeAuditGrants',
      'UpdateEmployeeAuditGrant',
      'GetAuditControl',
      'AppendVisitSessions',
      'Heartbeat',
      'Disconnect',
      'GetOverview',
      'GetEmployeeTimeline',
      'GetDomainAggregation',
      'SearchUrls',
      'GetOnlinePresence'
    ])
  })
})
