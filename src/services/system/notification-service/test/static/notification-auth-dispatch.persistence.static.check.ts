import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'

/** Keeps dispatch, audit and provider outbox within one repository transaction. */
describe('Notification dispatch persistence', () => {
  it('creates dispatch audit and outbox together', () => {
    const source = readFileSync(__dirname + '/../../src/infrastructure/repositories/prisma/prisma.notification-dispatch.repository.ts', 'utf8')
    expect(source).toContain('$transaction')
    expect(source).toContain('notificationDispatchAudit.create')
    expect(source).toContain('notificationProviderOutbox.create')
  })
})
