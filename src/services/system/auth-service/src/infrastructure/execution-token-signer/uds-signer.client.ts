import { connect } from 'node:net'
import type { ExecutionTokenSigningKey } from '../../domain/ports/execution-token-signing.port'
import type { KmsHsmExecutionTokenClient } from '../services/kms-hsm-execution-token-signing.adapter'

type SignerKeyResponse = {
  kid: unknown
  publicJwk: unknown
  publishNotBeforeUnixSeconds: unknown
  signingNotBeforeUnixSeconds: unknown
  signingNotAfterUnixSeconds: unknown
  retireAfterUnixSeconds: unknown
}

/** Calls only the frozen signer-agent methods through the configured pod-local Unix socket. */
export class UdsSignerClient implements KmsHsmExecutionTokenClient {
  constructor(private readonly socketPath: string) {
    if (!socketPath.startsWith('/')) throw new Error('signer socket path must be absolute')
  }

  /** Retrieves the one manifest-active signing key after validating every public rotation fact. */
  async activeSigningKey(): Promise<ExecutionTokenSigningKey> {
    return parseSignerKey(await this.call('GetActiveKey', {}))
  }

  /** Retrieves all manifest-published active and overlap keys after validating their public facts. */
  async publishedSigningKeys(): Promise<readonly ExecutionTokenSigningKey[]> {
    const result = await this.call('ListPublishedKeys', {})
    if (!Array.isArray(result) || result.length === 0)
      throw new Error('invalid signer key response')
    const keys = result.map(parseSignerKey)
    if (new Set(keys.map((key) => key.kid)).size !== keys.length)
      throw new Error('invalid signer key response')
    return Object.freeze(keys)
  }

  /** Delegates one active-kid JWS signing input and accepts only a canonical fixed-width JOSE signature. */
  async signEs256(kid: string, input: Uint8Array): Promise<Uint8Array> {
    if (!kid || input.length === 0) throw new Error('invalid signer request')
    const result = await this.call('SignEs256', {
      kid,
      signingInputBase64url: Buffer.from(input).toString('base64url')
    })
    if (!isRecord(result) || typeof result.signatureBase64url !== 'string')
      throw new Error('invalid signer signature response')
    const signature = Buffer.from(result.signatureBase64url, 'base64url')
    if (signature.length !== 64 || signature.toString('base64url') !== result.signatureBase64url)
      throw new Error('invalid signer signature response')
    return signature
  }

  /** Performs one bounded JSON-RPC call and rejects malformed, remote-error, or non-object responses. */
  private call(
    method: 'GetActiveKey' | 'ListPublishedKeys' | 'SignEs256',
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
          )
            throw new Error('invalid signer response')
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
    publicJwk: Object.freeze({ kty: 'EC', crv: 'P-256', x: key.publicJwk.x, y: key.publicJwk.y }),
    publishNotBeforeUnixSeconds: key.publishNotBeforeUnixSeconds,
    signingNotBeforeUnixSeconds: key.signingNotBeforeUnixSeconds,
    retireAfterUnixSeconds: key.retireAfterUnixSeconds
  })
}

/** Recognizes a plain JSON object without trusting prototype-provided members. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Restricts public rotation timestamps to finite whole Unix-second values. */
function isUnixSecond(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}
