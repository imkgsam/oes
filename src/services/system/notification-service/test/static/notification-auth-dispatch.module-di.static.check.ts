import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'

/** Ensures the trusted dispatch module remains present without touching Collaboration Task consumer wiring. */
describe('Notification trusted dispatch module', () => {
  it('installs the target guard, payload protector, and outbox worker', () => {
    const source = readFileSync(__dirname + '/../../src/modules/notification/notification.module.ts', 'utf8')
    expect(source).toContain('TrustedInternalExecutionGuard')
    expect(source).toContain('DeploymentNotificationDeliveryPayloadProtector')
    expect(source).toContain('NotificationProviderOutboxWorker')
  })
})
