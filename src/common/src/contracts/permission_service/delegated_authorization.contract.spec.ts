import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Guards Permission's delegated decision wire contract against credential issuance or consumption ownership. */
describe('Delegated authorization proto contract', () => {
  const source = readFileSync(join(__dirname, 'delegated_authorization.proto'), 'utf8')

  it('returns one auditable intersection decision and no credential', () => {
    expect(source).toContain('rpc ResolveDelegatedAuthorization')
    expect(source).toContain('repeated string allowed_permission_codes')
    expect(source).toContain('string authorization_decision_reference')
    expect(source).not.toMatch(/action_grant\s*=/)
    expect(source).not.toMatch(/access_token\s*=/)
  })
})
