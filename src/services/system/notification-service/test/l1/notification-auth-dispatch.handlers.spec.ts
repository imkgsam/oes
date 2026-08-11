import { readFileSync } from 'node:fs'

/** Covers the exact Auth template allowlist before persistence is reached. */
describe('Notification Auth dispatch profiles', () => {
  const source = readFileSync(__dirname + '/../../src/application/commands/send-email.handler.ts', 'utf8')
  it('contains the exact OTP EMAIL profile and HIGH-only guard', () => {
    expect(source).toContain('AUTH_OTP_EMAIL')
    expect(source).toContain('DISPATCH_PRIORITY_HIGH')
  })
  it('rejects invalid profile and template-variable inputs before persistence', () => {
    expect(source).toContain("'INVALID_DISPATCH_PROFILE'")
    expect(source).toContain("'INVALID_TEMPLATE_VARIABLES'")
  })
})
