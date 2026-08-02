import { randomBytes, timingSafeEqual } from 'node:crypto'

export type ApiKeyCredentialStatus = 'ACTIVE' | 'REVOKED'

export interface GeneratedApiKeyPresentation {
  keyIdentifier: string
  secret: string
  presentedKey: string
  createdAt: Date
  expiresAt: Date
}

export interface IssueApiKeyCredentialInput {
  integrationMachineId: string
  tenantId: string
  keyIdentifier: string
  secret: string
  verifier: string
  verifierKeyVersion: string
  now?: Date
  expiresAt?: Date
}

interface ApiKeyParts {
  identifier: string
  secret: string
}

const API_KEY_PREFIX = 'oek_live_'
const VERIFIER_BYTES = 32
const DUMMY_VERIFIER = Buffer.alloc(VERIFIER_BYTES).toString('base64url')

/** Represents an Auth-owned API-key verifier record without retaining its recoverable secret material. */
export class ApiKeyCredential {
  private _status: ApiKeyCredentialStatus
  private _revokedAt?: Date

  private constructor(
    public readonly integrationMachineId: string,
    public readonly tenantId: string,
    public readonly keyIdentifier: string,
    public readonly verifier: string,
    public readonly verifierKeyVersion: string,
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

  /** Generates the one-time identifier and secret pair that Auth later seals through the protected verifier provider. */
  static generatePresentation(input?: {
    now?: Date
    expiresAt?: Date
  }): GeneratedApiKeyPresentation {
    const createdAt = input?.now ?? new Date()
    const expiresAt = input?.expiresAt ?? ApiKeyCredential.defaultExpiry(createdAt)
    const keyIdentifier = randomBytes(18).toString('base64url')
    const secret = randomBytes(32).toString('base64url')
    return {
      keyIdentifier,
      secret,
      presentedKey: ApiKeyCredential.buildPresentedKey(keyIdentifier, secret),
      createdAt,
      expiresAt
    }
  }

  /** Materializes one persisted credential from a provider-computed verifier and the generated presentation. */
  static issue(input: IssueApiKeyCredentialInput): {
    credential: ApiKeyCredential
    presentedKey: string
  } {
    const createdAt = input.now ?? new Date()
    const expiresAt = input.expiresAt ?? ApiKeyCredential.defaultExpiry(createdAt)
    return {
      credential: new ApiKeyCredential(
        input.integrationMachineId,
        input.tenantId,
        input.keyIdentifier,
        input.verifier,
        input.verifierKeyVersion,
        createdAt,
        expiresAt
      ),
      presentedKey: ApiKeyCredential.buildPresentedKey(input.keyIdentifier, input.secret)
    }
  }

  /** Parses only the frozen external API-key presentation shape before Auth touches any provider path. */
  static parse(presentedKey: string): ApiKeyParts | undefined {
    const match = /^oek_live_([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(presentedKey)
    if (!match) {
      return undefined
    }
    if (
      !isCanonicalBase64UrlComponent(match[1], 18) ||
      !isCanonicalBase64UrlComponent(match[2], 32)
    ) {
      return undefined
    }
    return { identifier: match[1], secret: match[2] }
  }

  /** Provides the fixed non-secret verifier value used by the unknown-identifier deny path. */
  static dummyVerifier(): string {
    return DUMMY_VERIFIER
  }

  /** Compares two canonical verifier values with equal-length constant-time semantics. */
  static sameVerifier(candidate: string, expected: string): boolean {
    const candidateBytes = decodeCanonicalVerifier(candidate)
    const expectedBytes = decodeCanonicalVerifier(expected)
    return (
      candidateBytes !== undefined &&
      expectedBytes !== undefined &&
      candidateBytes.length === expectedBytes.length &&
      timingSafeEqual(candidateBytes, expectedBytes)
    )
  }

  /** Verifies a presented key only after Auth has obtained a provider-computed candidate verifier. */
  verify(presentedKey: string, candidateVerifier: string): boolean {
    const parts = ApiKeyCredential.parse(presentedKey)
    return (
      parts?.identifier === this.keyIdentifier &&
      ApiKeyCredential.sameVerifier(candidateVerifier, this.verifier)
    )
  }

  /** Verifies a provider-computed candidate against the stored verifier with constant-time equality. */
  matchesVerifier(candidateVerifier: string): boolean {
    return ApiKeyCredential.sameVerifier(candidateVerifier, this.verifier)
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

  /** Builds the frozen one-time API-key presentation string from its generated identifier and secret parts. */
  private static buildPresentedKey(identifier: string, secret: string): string {
    return `${API_KEY_PREFIX}${identifier}.${secret}`
  }

  /** Derives the one-year default expiration without allowing use to extend credential lifetime. */
  private static defaultExpiry(now: Date): Date {
    const expiresAt = new Date(now)
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    return expiresAt
  }
}

/** Accepts only the frozen unpadded base64url component shape and decoded byte length. */
function isCanonicalBase64UrlComponent(value: string, expectedBytes: number): boolean {
  try {
    const decoded = Buffer.from(value, 'base64url')
    return decoded.length === expectedBytes && decoded.toString('base64url') === value
  } catch {
    return false
  }
}

/** Decodes only canonical base64url verifier values so Auth never compares malformed provider output. */
function decodeCanonicalVerifier(value: string): Buffer | undefined {
  if (!value) {
    return undefined
  }
  try {
    const decoded = Buffer.from(value, 'base64url')
    return decoded.length === VERIFIER_BYTES && decoded.toString('base64url') === value
      ? decoded
      : undefined
  } catch {
    return undefined
  }
}
