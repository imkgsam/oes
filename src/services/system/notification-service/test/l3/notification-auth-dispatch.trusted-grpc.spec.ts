import { readFileSync } from 'node:fs'

/** Requires both externally reachable dispatch methods to remain one INTERNAL declaration each. */
describe('Notification Auth trusted gRPC boundary', () => {
  it('declares both RPCs as INTERNAL with the dedicated Code', () => {
    const source = readFileSync(__dirname + '/../../src/interfaces/grpc/notification.grpc.controller.ts', 'utf8')
    expect((source.match(/AuthorizeInternalCall/g) ?? []).length).toBe(3)
    expect((source.match(/NOTIFICATION_INTERNAL_PERMISSION_CODES\.AUTH_DISPATCH/g) ?? []).length).toBe(2)
  })
})
