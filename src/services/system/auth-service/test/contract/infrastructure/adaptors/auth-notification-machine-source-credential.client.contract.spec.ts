import { AuthNotificationMachineSourceCredentialClient } from '../../../../src/infrastructure/adaptors/auth-notification-machine-source-credential.client'

/** Verifies missing MACHINE binding configuration fails before any Auth bootstrap call. */
describe('AuthNotificationMachineSourceCredentialClient', () => {
  it('requires the dedicated Auth Notification principal binding', async () => {
    const previous = { ...process.env }
    delete process.env.AUTH_NOTIFICATION_MACHINE_PRINCIPAL_ID
    await expect(new AuthNotificationMachineSourceCredentialClient().issue()).rejects.toThrow('AUTH_NOTIFICATION_MACHINE_CONFIGURATION_REQUIRED')
    process.env = previous
  })
})
