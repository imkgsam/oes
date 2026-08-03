import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Guards Auth's delegation wire surface against body identity, signer selection and ActionGrant leakage. */
describe('Delegated execution proto contract', () => {
  const source = readFileSync(join(__dirname, 'delegated_execution.proto'), 'utf8')

  it('publishes the three frozen lifecycle operations', () => {
    expect(source).toContain('rpc CreateDelegationGrant')
    expect(source).toContain('rpc RevokeDelegationGrant')
    expect(source).toContain('rpc RequestActionGrant')
    expect(source).toContain('message ActionDescriptorV1')
  })

  it('keeps HUMAN, tenant, session, issuer, key and workload identity out of create body input', () => {
    const request = source.match(/message CreateDelegationGrantRequest \{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(request).not.toMatch(/human|session|tenant|issuer|kid|spiffe|certificate|private_key/i)
    expect(request).toContain('agent_principal_id')
    expect(request).toContain('tool_contract_id')
  })
})
