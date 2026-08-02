import { createHmac } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { ExternalApiKeyVerifierPort } from '../../application/ports/external-api-key-verifier.port'
import { ApiKeyCredential } from '../../domain/api-key/api-key.credential'

const DOMAIN_PREFIX = 'oes.auth.external-api-key-verifier/v1'

/** Runs the Auth API-key verifier contract locally with an explicit development-only software key file. */
export class LocalDevelopmentExternalApiKeyVerifier implements ExternalApiKeyVerifierPort {
  constructor(
    private readonly nodeEnv: string | undefined,
    private readonly securityProfile: string | undefined,
    private readonly keyPath: string | undefined,
    private readonly verifierKeyVersion: string | undefined
  ) {}

  /** Reports a single development-only active version and never claims staging or production readiness. */
  async getStatus() {
    const keyVersion = this.assertEnabled()
    return {
      activeVerifierKeyVersion: keyVersion,
      versions: [
        {
          verifierKeyVersion: keyVersion,
          state: 'ACTIVE' as const,
          activatedAt: new Date('2026-08-02T00:00:00.000Z')
        }
      ]
    }
  }

  /** Computes the fixed canonical HMAC verifier only for the explicit local-development profile. */
  async compute(input: {
    mode: 'ISSUE' | 'VERIFY'
    identifier: string
    secret: string
    verifierKeyVersion?: string
  }) {
    const keyVersion = this.assertEnabled()
    if (input.mode === 'ISSUE' && input.verifierKeyVersion) {
      throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    }
    if (input.mode === 'VERIFY' && input.verifierKeyVersion !== keyVersion) {
      throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    }
    const key = this.readKeyMaterial()
    const verifier = createHmac('sha256', key)
      .update(canonicalVerifierInput(input.identifier, input.secret))
      .digest('base64url')
    return { verifier, verifierKeyVersion: keyVersion }
  }

  /** Enforces the explicit development-only profile contract before any software verifier key is used. */
  private assertEnabled(): string {
    if (
      this.nodeEnv !== 'development' ||
      this.securityProfile !== 'local-development' ||
      !this.keyPath ||
      !this.verifierKeyVersion
    ) {
      throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    }
    return this.verifierKeyVersion
  }

  /** Reads only an owner-readable local key file so accidental shared or world-readable secrets are rejected. */
  private readKeyMaterial(): Buffer {
    const info = statSync(this.keyPath as string)
    if (info.mode & 0o077) {
      throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    }
    const value = readFileSync(this.keyPath as string)
    if (value.length !== 32) {
      throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    }
    return value
  }
}

/** Builds the fixed ADR 0017 HMAC input without permitting caller-selected domains or message shapes. */
function canonicalVerifierInput(identifier: string, secret: string): Buffer {
  if (!ApiKeyCredential.parse(`oek_live_${identifier}.${secret}`)) {
    throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
  }
  decodeCanonicalBase64Url(identifier, 18)
  return Buffer.concat([
    Buffer.from(DOMAIN_PREFIX, 'ascii'),
    Buffer.from([0]),
    Buffer.from(identifier, 'ascii'),
    Buffer.from([0]),
    decodeCanonicalBase64Url(secret, 32)
  ])
}

/** Decodes only canonical fixed-length base64url components so local development matches the protected runtime contract. */
function decodeCanonicalBase64Url(value: string, expectedLength: number): Buffer {
  const decoded = Buffer.from(value, 'base64url')
  if (decoded.length !== expectedLength || decoded.toString('base64url') !== value) {
    throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
  }
  return decoded
}
