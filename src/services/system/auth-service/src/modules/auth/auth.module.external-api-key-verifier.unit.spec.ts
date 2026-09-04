import * as authModuleExports from './auth.module'

/** Proves a missing protected provider closes only API-key operations instead of crashing Auth composition. */
describe('Auth external API-key verifier composition', () => {
  it('creates a fail-closed capability provider when the UDS binding is absent', async () => {
    const originalProvider = process.env.AUTH_EXTERNAL_API_KEY_VERIFIER_PROVIDER
    const originalSocket = process.env.AUTH_EXECUTION_SIGNER_SOCKET_PATH
    delete process.env.AUTH_EXTERNAL_API_KEY_VERIFIER_PROVIDER
    delete process.env.AUTH_EXECUTION_SIGNER_SOCKET_PATH

    try {
      const factory = (
        authModuleExports as typeof authModuleExports & {
          createExternalApiKeyVerifierProvider?: () => {
            getStatus(): Promise<unknown>
          }
        }
      ).createExternalApiKeyVerifierProvider
      expect(typeof factory).toBe('function')
      const provider = factory?.()
      await expect(provider?.getStatus()).rejects.toThrow('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    } finally {
      if (originalProvider === undefined) {
        delete process.env.AUTH_EXTERNAL_API_KEY_VERIFIER_PROVIDER
      } else {
        process.env.AUTH_EXTERNAL_API_KEY_VERIFIER_PROVIDER = originalProvider
      }
      if (originalSocket === undefined) {
        delete process.env.AUTH_EXECUTION_SIGNER_SOCKET_PATH
      } else {
        process.env.AUTH_EXECUTION_SIGNER_SOCKET_PATH = originalSocket
      }
    }
  })
})
