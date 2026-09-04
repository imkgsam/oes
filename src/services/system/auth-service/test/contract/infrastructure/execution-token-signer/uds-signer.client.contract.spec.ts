import { EventEmitter } from 'node:events'
import { connect } from 'node:net'
import { UdsSignerClient } from '../../../../src/infrastructure/execution-token-signer/uds-signer.client'

jest.mock('node:net', () => ({
  connect: jest.fn()
}))

const mockedConnect = connect as jest.MockedFunction<typeof connect>
const canonicalVerifier = Buffer.alloc(32, 9).toString('base64url')
const canonicalIdentifier = Buffer.alloc(18, 1).toString('base64url')
const canonicalSecret = Buffer.alloc(32, 2).toString('base64url')

/** Exercises Auth's JSON-RPC socket client contract without widening its fixed request/response shape. */
describe('UdsSignerClient', () => {
  afterEach(() => {
    mockedConnect.mockReset()
  })

  it('maps the active and overlap public key responses without accepting untyped data', async () => {
    const client = new UdsSignerClient('/private/tmp/fake.sock')
    queueResponse((request) => {
      if (request.method === 'GetActiveKey') return key('active')
      if (request.method === 'ListPublishedKeys') return [key('active'), key('overlap')]
      throw new Error('unexpected method')
    }, 2)

    await expect(client.activeSigningKey()).resolves.toMatchObject({
      kid: 'active',
      publicJwk: { crv: 'P-256' }
    })
    await expect(client.publishedSigningKeys()).resolves.toHaveLength(2)
  })

  it('sends only the frozen kid and base64url signing input and decodes a fixed-width JOSE signature', async () => {
    queueResponse((request) => {
      expect(request.method).toBe('SignEs256')
      expect(request.params).toEqual({
        kid: 'active',
        signingInputBase64url: 'aGVsbG8'
      })
      return { signatureBase64url: Buffer.alloc(64, 7).toString('base64url') }
    })

    await expect(
      new UdsSignerClient('/private/tmp/fake.sock').signEs256('active', Buffer.from('hello'))
    ).resolves.toEqual(Buffer.alloc(64, 7))
  })

  it('maps the fixed external API-key verifier status and compute methods without widening the socket contract', async () => {
    const client = new UdsSignerClient('/private/tmp/fake.sock')
    queueResponse((request) => {
      if (request.method === 'GetExternalApiKeyVerifierStatus') {
        return {
          activeVerifierKeyVersion: 'verifier-v2',
          versions: [
            {
              verifierKeyVersion: 'verifier-v2',
              state: 'ACTIVE',
              activatedAtUnixSeconds: 1_785_292_800
            },
            {
              verifierKeyVersion: 'verifier-v1',
              state: 'VERIFY_ONLY',
              activatedAtUnixSeconds: 1_785_206_400,
              verifyOnlyAtUnixSeconds: 1_785_292_800,
              retireAfterUnixSeconds: 1_785_552_000
            },
            {
              verifierKeyVersion: 'verifier-v0',
              state: 'COMPROMISED_DISABLED',
              incidentReference: 'INC-1',
              occurredAtUnixSeconds: 1_785_120_000,
              stateRevision: 'rev-7'
            }
          ]
        }
      }
      if (request.method === 'ComputeExternalApiKeyVerifier') {
        expect(request.params).toEqual({
          mode: 'VERIFY',
          identifier: canonicalIdentifier,
          secret: canonicalSecret,
          verifierKeyVersion: 'verifier-v1'
        })
        return {
          verifier: canonicalVerifier,
          verifierKeyVersion: 'verifier-v1'
        }
      }
      throw new Error('unexpected method')
    }, 2)

    await expect(client.getExternalApiKeyVerifierStatus()).resolves.toMatchObject({
      activeVerifierKeyVersion: 'verifier-v2',
      versions: [
        { verifierKeyVersion: 'verifier-v2', state: 'ACTIVE' },
        { verifierKeyVersion: 'verifier-v1', state: 'VERIFY_ONLY' },
        {
          verifierKeyVersion: 'verifier-v0',
          state: 'COMPROMISED_DISABLED',
          incidentReference: 'INC-1',
          stateRevision: 'rev-7'
        }
      ]
    })
    await expect(
      client.computeExternalApiKeyVerifier({
        mode: 'VERIFY',
        identifier: canonicalIdentifier,
        secret: canonicalSecret,
        verifierKeyVersion: 'verifier-v1'
      })
    ).resolves.toEqual({
      verifier: canonicalVerifier,
      verifierKeyVersion: 'verifier-v1'
    })
  })

  it('fails closed for malformed key, signature, and verifier responses', async () => {
    const client = new UdsSignerClient('/private/tmp/fake.sock')
    queueResponse((request) => {
      if (request.method === 'GetActiveKey') {
        return {
          ...key('active'),
          publicJwk: { ...key('active').publicJwk, crv: 'P-384' }
        }
      }
      if (request.method === 'SignEs256') return { signatureBase64url: 'YQ' }
      if (request.method === 'GetExternalApiKeyVerifierStatus') {
        return { activeVerifierKeyVersion: '', versions: [] }
      }
      if (request.method === 'ComputeExternalApiKeyVerifier') {
        return { verifier: 'bad', verifierKeyVersion: '' }
      }
      return jsonRpcError('no')
    }, 5)

    await expect(client.activeSigningKey()).rejects.toThrow('invalid signer key response')
    await expect(client.signEs256('active', Buffer.from('a'))).rejects.toThrow(
      'invalid signer signature response'
    )
    await expect(client.publishedSigningKeys()).rejects.toThrow('invalid signer response')
    await expect(client.getExternalApiKeyVerifierStatus()).rejects.toThrow(
      'invalid external API-key verifier status response'
    )
    await expect(
      client.computeExternalApiKeyVerifier({
        mode: 'VERIFY',
        identifier: canonicalIdentifier,
        secret: canonicalSecret,
        verifierKeyVersion: 'verifier-v1'
      })
    ).rejects.toThrow('invalid external API-key verifier response')
  })

  it('rejects noncanonical verifier inputs before opening the socket', async () => {
    const client = new UdsSignerClient('/private/tmp/nonexistent-verifier.sock')

    await expect(
      client.computeExternalApiKeyVerifier({
        mode: 'ISSUE',
        identifier: 'identifier',
        secret: canonicalSecret
      })
    ).rejects.toThrow('invalid external API-key verifier request')
    expect(mockedConnect).not.toHaveBeenCalled()
  })

  it('rejects malformed verifier lifecycle metadata', async () => {
    queueResponse(() => ({
      activeVerifierKeyVersion: 'verifier-v1',
      versions: [
        {
          verifierKeyVersion: 'verifier-v1',
          state: 'ACTIVE',
          activatedAtUnixSeconds: 1_785_292_800,
          verifyOnlyAtUnixSeconds: 1_785_292_801,
          retireAfterUnixSeconds: 1_785_552_000
        }
      ]
    }))

    await expect(
      new UdsSignerClient('/private/tmp/fake.sock').getExternalApiKeyVerifierStatus()
    ).rejects.toThrow('invalid external API-key verifier status response')
  })

  it('rejects malformed compromised-disabled verifier evidence', async () => {
    queueResponse(() => ({
      activeVerifierKeyVersion: 'verifier-v2',
      versions: [
        {
          verifierKeyVersion: 'verifier-v2',
          state: 'ACTIVE',
          activatedAtUnixSeconds: 1_785_292_800
        },
        {
          verifierKeyVersion: 'verifier-v1',
          state: 'COMPROMISED_DISABLED',
          incidentReference: '',
          occurredAtUnixSeconds: 1_785_120_000,
          stateRevision: 'rev-1'
        }
      ]
    }))

    await expect(
      new UdsSignerClient('/private/tmp/fake.sock').getExternalApiKeyVerifierStatus()
    ).rejects.toThrow('invalid external API-key verifier status response')
  })
})

function queueResponse(
  handler: (request: { method: string; params: unknown }) => unknown,
  repeat = 1
) {
  for (let index = 0; index < repeat; index += 1) {
    mockedConnect.mockImplementationOnce(
      () => new FakeSocket(handler) as unknown as ReturnType<typeof connect>
    )
  }
}

function key(kid: string) {
  return {
    kid,
    publicJwk: { kty: 'EC', crv: 'P-256', x: 'A'.repeat(43), y: 'B'.repeat(43) },
    publishNotBeforeUnixSeconds: 1_700_000_000,
    signingNotBeforeUnixSeconds: 1_700_000_300,
    signingNotAfterUnixSeconds: 1_800_000_000,
    retireAfterUnixSeconds: 1_800_000_360
  }
}

class FakeSocket extends EventEmitter {
  constructor(private readonly handler: (request: { method: string; params: unknown }) => unknown) {
    super()
    queueMicrotask(() => this.emit('connect'))
  }

  setTimeout(): this {
    return this
  }

  destroy(): this {
    return this
  }

  write(payload: string): boolean {
    const request = JSON.parse(payload.trim()) as { method: string; params: unknown }
    try {
      const result = this.handler(request)
      this.emit(
        'data',
        Buffer.from(
          `${JSON.stringify(
            isJsonRpcError(result)
              ? { jsonrpc: '2.0', id: 1, error: { message: result.message } }
              : { jsonrpc: '2.0', id: 1, result }
          )}\n`
        )
      )
    } catch (error) {
      this.emit(
        'data',
        Buffer.from(
          `${JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            error: { message: error instanceof Error ? error.message : 'error' }
          })}\n`
        )
      )
    }
    return true
  }
}

function jsonRpcError(message: string) {
  return { kind: 'json-rpc-error' as const, message }
}

function isJsonRpcError(value: unknown): value is ReturnType<typeof jsonRpcError> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === 'json-rpc-error'
  )
}
