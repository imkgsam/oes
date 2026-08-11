import { readFileSync } from 'node:fs'

/** Locks the Notification producer onto Common's certificate-bound provider/cache path. */
describe('AuthNotificationTrustedGrpcExecutionProducer', () => {
  it('uses target-bound INTERNAL metadata with the frozen audience and Code', () => {
    const source = readFileSync(__dirname + '/auth-notification-trusted-grpc-execution.producer.ts', 'utf8')
    expect(source).toContain("urn:oes:service:notification-service")
    expect(source).toContain("notification.internal.auth.dispatch")
    expect(source).toContain('TrustedGrpcMetadataProvider')
  })
})
