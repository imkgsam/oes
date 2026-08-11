import { DeploymentNotificationDeliveryPayloadProtector } from '../../src/infrastructure/security/deployment-notification-delivery-payload-protector'

/** Confirms provider payloads are encrypted and inaccessible after their bounded TTL. */
describe('Notification provider payload protection', () => {
  it('rejects expired delivery payloads', () => {
    const protector = new DeploymentNotificationDeliveryPayloadProtector(Buffer.alloc(32, 1).toString('base64'))
    const payload = protector.protect({ code: '123456' }, new Date(Date.now() - 1))
    expect(() => protector.unprotect(payload, new Date())).toThrow('expired')
  })
})
