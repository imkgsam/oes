/** Resolves versioned API-key verifier material only inside Auth's protected infrastructure boundary. */
export interface ExternalApiKeyPepperPort { resolve(): Promise<{ version: string; material: string }> }
export const EXTERNAL_API_KEY_PEPPER_PORT = 'ExternalApiKeyPepperPort'
