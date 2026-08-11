import { AuthNotificationMachineSourceCredentialProvider } from './auth-notification-machine-source-credential.provider'

/** Ensures the opaque source bearer stays inside the private carrier scope. */
describe('AuthNotificationMachineSourceCredentialProvider', () => {
  it('runs callbacks with a non-serializable private credential handle', async () => {
    const provider = new AuthNotificationMachineSourceCredentialProvider({ issue: jest.fn(async () => 'opaque-source') } as any)
    await expect(provider.run(async () => provider.accessor.useCurrent((value) => value))).resolves.toBe('opaque-source')
  })
})
