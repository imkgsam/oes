import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

export type ApiKeyCredentialStatus = 'ACTIVE' | 'REVOKED'

export interface IssueApiKeyCredentialInput {
  integrationMachineId: string
  tenantId: string
  pepper: string
  pepperVersion: string
  now?: Date
  expiresAt?: Date
}

interface ApiKeyParts {
  identifier: string
  secret: string
}

/** Represents an Auth-owned API key verifier without retaining its recoverable secret. */
export class ApiKeyCredential {
  private _status: ApiKeyCredentialStatus
  private _revokedAt?: Date

  private constructor(
    public readonly integrationMachineId: string,
    public readonly tenantId: string,
    public readonly keyIdentifier: string,
    public readonly verifier: string,
    public readonly pepperVersion: string,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    status: ApiKeyCredentialStatus = 'ACTIVE',
    revokedAt?: Date
  ) {
    this._status = status
    this._revokedAt = revokedAt
  }

  /** Exposes the current lifecycle status without allowing callers to reactivate a credential. */
  get status(): ApiKeyCredentialStatus {
    return this._status
  }

  /** Exposes the permanent revocation timestamp when a credential has been revoked. */
  get revokedAt(): Date | undefined {
    return this._revokedAt
  }

  /** Issues a cryptographically random, one-time-presented key and stores only its HMAC verifier. */
  static issue(input: IssueApiKeyCredentialInput): {
    credential: ApiKeyCredential
    presentedKey: string
  } {
    const now = input.now ?? new Date()
    const expiresAt = input.expiresAt ?? ApiKeyCredential.defaultExpiry(now)
    const identifier = randomBytes(18).toString('base64url')
    const secret = randomBytes(32).toString('base64url')
    const presentedKey = `oek_live_${identifier}.${secret}`

    return {
      credential: new ApiKeyCredential(
        input.integrationMachineId,
        input.tenantId,
        identifier,
        ApiKeyCredential.createVerifier(identifier, secret, input.pepper),
        input.pepperVersion,
        now,
        expiresAt
      ),
      presentedKey
    }
  }

  /** Verifies a presented key in constant time while rejecting malformed or mismatched credentials. */
  verify(presentedKey: string, pepper: string): boolean {
    const parts = ApiKeyCredential.parse(presentedKey)
    if (!parts || parts.identifier !== this.keyIdentifier || !pepper) {
      return false
    }

    const candidate = Buffer.from(
      ApiKeyCredential.createVerifier(parts.identifier, parts.secret, pepper),
      'hex'
    )
    const expected = Buffer.from(this.verifier, 'hex')

    return candidate.length === expected.length && timingSafeEqual(candidate, expected)
  }

  /** Reports whether a credential remains active and strictly before its configured expiry. */
  canExchange(now: Date = new Date()): boolean {
    return this.status === 'ACTIVE' && now.getTime() < this.expiresAt.getTime()
  }

  /** Permanently disables the credential so a leaked secret can never be reactivated. */
  revoke(revokedAt: Date = new Date()): void {
    if (this.status === 'REVOKED') {
      return
    }

    this._status = 'REVOKED'
    this._revokedAt = revokedAt
  }

  /** Derives the one-year default expiration without allowing use to extend credential lifetime. */
  private static defaultExpiry(now: Date): Date {
    const expiresAt = new Date(now)
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    return expiresAt
  }

  /** Produces the irreversible verifier over both key components to prevent cross-credential mixing. */
  private static createVerifier(identifier: string, secret: string, pepper: string): string {
    return createHmac('sha256', pepper).update(`${identifier}.${secret}`).digest('hex')
  }

  /** Parses only the frozen external API key presentation format. */
  private static parse(presentedKey: string): ApiKeyParts | undefined {
    const match = /^oek_live_([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(presentedKey)
    if (!match) {
      return undefined
    }

    return { identifier: match[1], secret: match[2] }
  }
}
