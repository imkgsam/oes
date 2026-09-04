import { describe, it, test } from 'node:test'
import { expect } from '../../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'

/** Locks the Auth STS adapter to Common-carried target and Code inputs. */
describe('AuthNotificationExecutionTokenExchangeClient', () => {
  it('does not accept a raw source credential parameter', () => {
    const source = readFileSync(__dirname + '/auth-notification-execution-token-exchange.client.ts', 'utf8')
    expect(source).toContain('ExecutionTokenExchangeRequest')
    expect(source).not.toContain('exchange(sourceCredential')
  })
})
