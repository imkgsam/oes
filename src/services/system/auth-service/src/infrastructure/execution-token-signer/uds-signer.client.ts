import { connect } from 'node:net'
import type { ExecutionTokenSigningKey } from '../../domain/ports/execution-token-signing.port'
import type {
  ActiveExternalApiKeyVerifierVersionStatus,
  CompromisedDisabledExternalApiKeyVerifierVersionStatus,
  VerifyOnlyExternalApiKeyVerifierVersionStatus
} from '../../application/ports/external-api-key-verifier.port'
import type { KmsHsmExecutionTokenClient } from '../services/kms-hsm-execution-token-signing.adapter'

type SignerKeyResponse = {
  kid: unknown
  publicJwk: unknown
  publishNotBeforeUnixSeconds: unknown
  signingNotBeforeUnixSeconds: unknown
  signingNotAfterUnixSeconds: unknown
  retireAfterUnixSeconds: unknown
}

type ActiveVerifierVersionResponse = {
  verifierKeyVersion: unknown
  state: 'ACTIVE'
  activatedAtUnixSeconds: unknown
}

type VerifyOnlyVerifierVersionResponse = {
  verifierKeyVersion: unknown
  state: 'VERIFY_ONLY'
  activatedAtUnixSeconds: unknown
  verifyOnlyAtUnixSeconds: unknown
  retireAfterUnixSeconds: unknown
}

type CompromisedDisabledVerifierVersionResponse = {
  verifierKeyVersion: unknown
  state: 'COMPROMISED_DISABLED'
  incidentReference: unknown
  occurredAtUnixSeconds: unknown
  stateRevision: unknown
}

type ExternalApiKeyVerifierVersionResponse =
  | ActiveVerifierVersionResponse
  | VerifyOnlyVerifierVersionResponse
  | CompromisedDisabledVerifierVersionResponse

/** Calls only the frozen signer-agent methods through the configured pod-local Unix socket. */
export class UdsSignerClient implements KmsHsmExecutionTokenClient {
  constructor(private readonly socketPath: string) {
    if (!socketPath.startsWith('/')) {
      throw new Error('signer socket path must be absolute')
    }
  }

  /** Retrieves the one manifest-active signing key after validating every public rotation fact. */
  async activeSigningKey(): Promise<ExecutionTokenSigningKey> {
    return parseSignerKey(await this.call('GetActiveKey', {}))
  }

  /** Retrieves all manifest-published active and overlap keys after validating their public facts. */
  async publishedSigningKeys(): Promise<readonly ExecutionTokenSigningKey[]> {
    const result = await this.call('ListPublishedKeys', {})
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('invalid signer key response')
    }
    const keys = result.map(parseSignerKey)
    if (new Set(keys.map((key) => key.kid)).size !== keys.length) {
      throw new Error('invalid signer key response')
    }
    return Object.freeze(keys)
  }

  /** Delegates one active-kid JWS signing input and accepts only a canonical fixed-width JOSE signature. */
  async signEs256(kid: string, input: Uint8Array): Promise<Uint8Array> {
    if (!kid || input.length === 0) {
      throw new Error('invalid signer request')
    }
    const result = await this.call('SignEs256', {
      kid,
      signingInputBase64url: Buffer.from(input).toString('base64url')
    })
    if (!isRecord(result) || typeof result.signatureBase64url !== 'string') {
      throw new Error('invalid signer signature response')
    }
    const signature = Buffer.from(result.signatureBase64url, 'base64url')
    if (signature.length !== 64 || signature.toString('base64url') !== result.signatureBase64url) {
      throw new Error('invalid signer signature response')
    }
    return signature
  }

  /** Retrieves the fixed provider readiness metadata for the external API-key verifier path. */
  async getExternalApiKeyVerifierStatus(): Promise<{
    activeVerifierKeyVersion: string
    versions: readonly (
      | ActiveExternalApiKeyVerifierVersionStatus
      | VerifyOnlyExternalApiKeyVerifierVersionStatus
      | CompromisedDisabledExternalApiKeyVerifierVersionStatus
    )[]
  }> {
    const result = await this.call('GetExternalApiKeyVerifierStatus', {})
    if (
      !isRecord(result) ||
      typeof result.activeVerifierKeyVersion !== 'string' ||
      !result.activeVerifierKeyVersion ||
      !Array.isArray(result.versions) ||
      result.versions.length === 0
    ) {
      throw new Error('invalid external API-key verifier status response')
    }
    const versions = result.versions.map(parseExternalApiKeyVerifierVersion)
    const activeVersions = versions.filter((version) => version.state === 'ACTIVE')
    if (
      new Set(versions.map((version) => version.verifierKeyVersion)).size !== versions.length ||
      activeVersions.length !== 1 ||
      activeVersions[0]?.verifierKeyVersion !== result.activeVerifierKeyVersion
    ) {
      throw new Error('invalid external API-key verifier status response')
    }
    return {
      activeVerifierKeyVersion: result.activeVerifierKeyVersion,
      versions
    }
  }

  /** Delegates only the fixed ISSUE or VERIFY verifier operation without exposing raw key material. */
  async computeExternalApiKeyVerifier(input: {
    mode: 'ISSUE' | 'VERIFY'
    identifier: string
    secret: string
    verifierKeyVersion?: string
  }): Promise<{ verifier: string; verifierKeyVersion: string }> {
    const params = parseVerifierRequest(input)
    const result = await this.call('ComputeExternalApiKeyVerifier', params)
    if (
      !isRecord(result) ||
      typeof result.verifier !== 'string' ||
      !isCanonicalVerifier(result.verifier) ||
      typeof result.verifierKeyVersion !== 'string' ||
      !result.verifierKeyVersion
    ) {
      throw new Error('invalid external API-key verifier response')
    }
    return {
      verifier: result.verifier,
      verifierKeyVersion: result.verifierKeyVersion
    }
  }

  /** Performs one bounded JSON-RPC call and rejects malformed, remote-error, or non-object responses. */
  private call(
    method:
      | 'GetActiveKey'
      | 'ListPublishedKeys'
      | 'SignEs256'
      | 'GetExternalApiKeyVerifierStatus'
      | 'ComputeExternalApiKeyVerifier',
    params: object
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const socket = connect(this.socketPath)
      let responseText = ''
      let settled = false
      const fail = (error: Error) => {
        if (!settled) {
          settled = true
          socket.destroy()
          reject(error)
        }
      }
      socket.setTimeout(3_000)
      socket.once('error', () => fail(new Error('signer unavailable')))
      socket.once('timeout', () => fail(new Error('signer unavailable')))
      socket.on('data', (chunk) => {
        responseText += chunk.toString('utf8')
        if (!responseText.includes('\n') || settled) return
        try {
          const response = JSON.parse(responseText.trim()) as unknown
          if (
            !isRecord(response) ||
            response.jsonrpc !== '2.0' ||
            'error' in response ||
            !Object.hasOwn(response, 'result')
          ) {
            throw new Error('invalid signer response')
          }
          settled = true
          socket.destroy()
          resolve(response.result)
        } catch (error) {
          fail(error instanceof Error ? error : new Error('invalid signer response'))
        }
      })
      socket.on('connect', () =>
        socket.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })}\n`)
      )
    })
  }
}

/** Validates one public key record before it can cross Auth's infrastructure boundary. */
function parseSignerKey(value: unknown): ExecutionTokenSigningKey {
  if (!isRecord(value)) throw new Error('invalid signer key response')
  const key = value as SignerKeyResponse
  if (
    !isRecord(key.publicJwk) ||
    typeof key.kid !== 'string' ||
    !key.kid ||
    key.publicJwk.kty !== 'EC' ||
    key.publicJwk.crv !== 'P-256' ||
    typeof key.publicJwk.x !== 'string' ||
    typeof key.publicJwk.y !== 'string' ||
    !isUnixSecond(key.publishNotBeforeUnixSeconds) ||
    !isUnixSecond(key.signingNotBeforeUnixSeconds) ||
    !isUnixSecond(key.signingNotAfterUnixSeconds) ||
    !isUnixSecond(key.retireAfterUnixSeconds) ||
    key.publishNotBeforeUnixSeconds + 300 > key.signingNotBeforeUnixSeconds ||
    key.signingNotBeforeUnixSeconds >= key.signingNotAfterUnixSeconds ||
    key.retireAfterUnixSeconds < key.signingNotAfterUnixSeconds + 360
  ) {
    throw new Error('invalid signer key response')
  }
  return Object.freeze({
    kid: key.kid,
    publicJwk: Object.freeze({
      kty: 'EC',
      crv: 'P-256',
      x: key.publicJwk.x,
      y: key.publicJwk.y
    }),
    publishNotBeforeUnixSeconds: key.publishNotBeforeUnixSeconds,
    signingNotBeforeUnixSeconds: key.signingNotBeforeUnixSeconds,
    retireAfterUnixSeconds: key.retireAfterUnixSeconds
  })
}

/** Validates one verifier-version record before Auth consumes readiness or rotation state from the provider. */
function parseExternalApiKeyVerifierVersion(value: unknown) {
  if (!isRecord(value)) {
    throw new Error('invalid external API-key verifier status response')
  }
  const version = value as ExternalApiKeyVerifierVersionResponse
  const versionFields = value as Record<string, unknown>
  if (
    typeof version.verifierKeyVersion !== 'string' ||
    !version.verifierKeyVersion ||
    (version.state !== 'ACTIVE' &&
      version.state !== 'VERIFY_ONLY' &&
      version.state !== 'COMPROMISED_DISABLED')
  ) {
    throw new Error('invalid external API-key verifier status response')
  }
  if (version.state === 'ACTIVE') {
    if (
      !isUnixSecond(version.activatedAtUnixSeconds) ||
      versionFields.verifyOnlyAtUnixSeconds != null ||
      versionFields.retireAfterUnixSeconds != null ||
      versionFields.incidentReference != null ||
      versionFields.occurredAtUnixSeconds != null ||
      versionFields.stateRevision != null
    ) {
      throw new Error('invalid external API-key verifier status response')
    }
    return Object.freeze({
      verifierKeyVersion: version.verifierKeyVersion,
      state: 'ACTIVE' as const,
      activatedAt: new Date(version.activatedAtUnixSeconds * 1_000)
    })
  }
  if (version.state === 'VERIFY_ONLY') {
    if (
      !isUnixSecond(version.activatedAtUnixSeconds) ||
      !isUnixSecond(version.verifyOnlyAtUnixSeconds) ||
      !isUnixSecond(version.retireAfterUnixSeconds) ||
      versionFields.incidentReference != null ||
      versionFields.occurredAtUnixSeconds != null ||
      versionFields.stateRevision != null ||
      version.activatedAtUnixSeconds > version.verifyOnlyAtUnixSeconds ||
      version.verifyOnlyAtUnixSeconds >= version.retireAfterUnixSeconds
    ) {
      throw new Error('invalid external API-key verifier status response')
    }
    return Object.freeze({
      verifierKeyVersion: version.verifierKeyVersion,
      state: 'VERIFY_ONLY' as const,
      activatedAt: new Date(version.activatedAtUnixSeconds * 1_000),
      verifyOnlyAt: new Date(version.verifyOnlyAtUnixSeconds * 1_000),
      retireAfter: new Date(version.retireAfterUnixSeconds * 1_000)
    })
  }
  if (
    versionFields.activatedAtUnixSeconds != null ||
    versionFields.verifyOnlyAtUnixSeconds != null ||
    versionFields.retireAfterUnixSeconds != null ||
    typeof version.incidentReference !== 'string' ||
    !version.incidentReference ||
    !isUnixSecond(version.occurredAtUnixSeconds) ||
    typeof version.stateRevision !== 'string' ||
    !version.stateRevision
  ) {
    throw new Error('invalid external API-key verifier status response')
  }
  return Object.freeze({
    verifierKeyVersion: version.verifierKeyVersion,
    state: 'COMPROMISED_DISABLED' as const,
    incidentReference: version.incidentReference,
    occurredAt: new Date(version.occurredAtUnixSeconds * 1_000),
    stateRevision: version.stateRevision
  })
}

/** Enforces the fixed verifier-operation request shape before any sensitive UDS call leaves Auth. */
function parseVerifierRequest(input: {
  mode: 'ISSUE' | 'VERIFY'
  identifier: string
  secret: string
  verifierKeyVersion?: string
}) {
  if (!isCanonicalBase64Url(input.identifier, 18) || !isCanonicalBase64Url(input.secret, 32)) {
    throw new Error('invalid external API-key verifier request')
  }
  if (input.mode === 'ISSUE' && input.verifierKeyVersion) {
    throw new Error('invalid external API-key verifier request')
  }
  if (
    input.mode === 'VERIFY' &&
    (!input.verifierKeyVersion ||
      !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/.test(input.verifierKeyVersion))
  ) {
    throw new Error('invalid external API-key verifier request')
  }
  return input.mode === 'ISSUE'
    ? { mode: input.mode, identifier: input.identifier, secret: input.secret }
    : {
        mode: input.mode,
        identifier: input.identifier,
        secret: input.secret,
        verifierKeyVersion: input.verifierKeyVersion
      }
}

/** Detects a canonical unpadded base64url verifier output with its fixed 32-byte decoded width. */
function isCanonicalVerifier(value: string): boolean {
  return isCanonicalBase64Url(value, 32)
}

/** Accepts only canonical unpadded base64url data of the exact decoded width required by the contract. */
function isCanonicalBase64Url(value: unknown, decodedLength: number): value is string {
  if (typeof value !== 'string' || value.length === 0) {
    return false
  }
  const decoded = Buffer.from(value, 'base64url')
  return decoded.length === decodedLength && decoded.toString('base64url') === value
}

/** Detects one integer Unix-second timestamp without permitting floats, strings, or negative values. */
function isUnixSecond(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/** Narrows an arbitrary value to a plain JSON object record. */
function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
