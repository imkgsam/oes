import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Auth login owner resolver transport', () => {
  const source = readFileSync(join(__dirname, 'identity-service.adaptor.ts'), 'utf8')

  it('uses only the exact Identity Auth-login INTERNAL Code for account candidates and employee binding', () => {
    expect(source).toContain(
      "const AUTH_LOGIN_ACCOUNT_RESOLVE_PERMISSION = 'identity.internal.auth_login_account.resolve'"
    )
    expect(source).toContain('this.identityQueryService.listAuthLoginAccountCandidates(')
    expect(source).toContain('this.identityQueryService.resolveAuthEmployeeLoginAccount(')
    expect(source.match(/AUTH_LOGIN_ACCOUNT_RESOLVE_PERMISSION/g)).toHaveLength(3)
  })

  it('does not use the generic BUSINESS account Code for the two pre-HUMAN owner lookups', () => {
    const candidateBlock = source.slice(
      source.indexOf('async getAvailableAccountsByUserId'),
      source.indexOf('async getAccountById')
    )
    const employeeBlock = source.slice(
      source.indexOf('async resolveEmployeeLoginAccount'),
      source.indexOf('/** Reads Identity-owned machine')
    )
    expect(candidateBlock).not.toContain('forBusinessCall')
    expect(candidateBlock).not.toContain('identity.account.list')
    expect(employeeBlock).not.toContain('forBusinessCall')
    expect(employeeBlock).not.toContain('identity.account.list')
  })
})
