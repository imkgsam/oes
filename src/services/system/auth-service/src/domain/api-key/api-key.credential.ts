import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto'

export type ApiKeyCredentialStatus = 'ACTIVE' | 'REVOKED' | 'DISABLED' | 'SUPERSEDED'

export interface IssueApiKeyCredentialInput {
  integrationMachineId: string
  tenantId: string
  pepper: string
  pepperVersion: string
  now?: Date
  expiresAt?: Date
}

/** Owns opaque API-key material and constant-time verification without retaining recoverable secrets. */
export class ApiKeyCredential {
  private constructor(
    public readonly id: string,
    public readonly keyIdentifier: string,
    public readonly integrationMachineId: string,
    public readonly tenantId: string,
    public readonly verifier: string,
    public readonly pepperVersion: string,
    public status: ApiKeyCredentialStatus,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    public supersededAt?: Date,
    public revokedAt?: Date
  ) {}

  /** Issues one credential and returns its full key exactly at the creation boundary. */
  static issue(input: IssueApiKeyCredentialInput): { credential: ApiKeyCredential; presentedKey: string } {
    const now = input.now ?? new Date()
    const keyIdentifier = randomBytes(18).toString('base64url')
    const secret = randomBytes(32).toString('base64url')
    const presentedKey = `oek_live_${keyIdentifier}.${secret}`
    const expiresAt = input.expiresAt ?? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

    return {
      credential: new ApiKeyCredential(
        randomUUID(),
        keyIdentifier,
        input.integrationMachineId,
        input.tenantId,
        ApiKeyCredential.createVerifier(keyIdentifier, secret, input.pepper),
        input.pepperVersion,
        'ACTIVE',
        now,
        expiresAt
      ),
      presentedKey
    }
  }

  /** Verifies one presented key using its version-selected pepper and constant-time digest comparison. */
  verify(presentedKey: string, pepper: string): boolean {
    const parsed = ApiKeyCredential.parse(presentedKey)
    if (!parsed || parsed.keyIdentifier !== this.keyIdentifier) {
      return false
    }

    const expected = Buffer.from(this.verifier, 'base64url')
    const actual = Buffer.from(ApiKeyCredential.createVerifier(parsed.keyIdentifier, parsed.secret, pepper), 'base64url')
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  }

  /** Parses only the frozen two-part external credential representation. */
  static parse(presentedKey: string): { keyIdentifier: string; secret: string } | undefined {
    const match = /^oek_live_([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(presentedKey)
    return match ? { keyIdentifier: match[1], secret: match[2] } : undefined
  }

  /** Derives an irreversible keyed verifier from identifier and secret. */
  private static createVerifier(keyIdentifier: string, secret: string, pepper: string): string {
    return createHmac('sha256', pepper).update(`${keyIdentifier}.${secret}`, 'utf8').digest('base64url')
  }
}
