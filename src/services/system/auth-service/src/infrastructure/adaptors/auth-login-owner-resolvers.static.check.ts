import { describe, it, test } from 'node:test'
import { expect } from '../../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Auth login owner resolver transport', () => {
  const source = readFileSync(join(__dirname, 'identity-service.adaptor.ts'), 'utf8')

  it('uses only the exact Identity Auth-login INTERNAL Code for every pre-HUMAN owner lookup', () => {
    expect(source).toContain(
      "const AUTH_LOGIN_ACCOUNT_RESOLVE_PERMISSION = 'identity.internal.auth_login_account.resolve'"
    )
    for (const [start, end] of [
      ['async getAvailableAccountsByUserId', 'async getAccountById'],
      ['async resolveAuthLoginAccount', 'async resolveEmployeeLoginAccount'],
      ['async resolveEmployeeLoginAccount', '/** Reads Identity-owned machine']
    ]) {
      const block = source.slice(source.indexOf(start), source.indexOf(end))
      expect(block).toContain('AUTH_LOGIN_ACCOUNT_RESOLVE_PERMISSION')
      expect(block).not.toContain('identity.account.list')
      expect(block).not.toContain('forBusinessCall')
    }
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
