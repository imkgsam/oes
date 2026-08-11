import { readFileSync } from 'node:fs'

/** Locks the Auth STS adapter to Common-carried target and Code inputs. */
describe('AuthNotificationExecutionTokenExchangeClient', () => {
  it('does not accept a raw source credential parameter', () => {
    const source = readFileSync(__dirname + '/auth-notification-execution-token-exchange.client.ts', 'utf8')
    expect(source).toContain('ExecutionTokenExchangeRequest')
    expect(source).not.toContain('exchange(sourceCredential')
  })
})
