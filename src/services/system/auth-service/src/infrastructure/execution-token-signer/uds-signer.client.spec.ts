import { createServer } from 'node:net'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { UdsSignerClient } from './uds-signer.client'

/** Exercises Auth's real Unix-socket client contract while keeping the protected provider outside unit tests. */
describe('UdsSignerClient', () => {
  it('maps the active and overlap public key responses without accepting untyped data', async () => {
    const socket = await startSocket((request) => {
      if (request.method === 'GetActiveKey') return key('active')
      if (request.method === 'ListPublishedKeys') return [key('active'), key('overlap')]
      throw new Error('unexpected method')
    })
    const client = new UdsSignerClient(socket.path)

    await expect(client.activeSigningKey()).resolves.toMatchObject({
      kid: 'active',
      publicJwk: { crv: 'P-256' }
    })
    await expect(client.publishedSigningKeys()).resolves.toHaveLength(2)

    await socket.close()
  })

  it('sends only the frozen kid and base64url signing input and decodes a fixed-width JOSE signature', async () => {
    const socket = await startSocket((request) => {
      expect(request.method).toBe('SignEs256')
      expect(request.params).toEqual({ kid: 'active', signingInputBase64url: 'aGVsbG8' })
      return { signatureBase64url: Buffer.alloc(64, 7).toString('base64url') }
    })

    await expect(
      new UdsSignerClient(socket.path).signEs256('active', Buffer.from('hello'))
    ).resolves.toEqual(Buffer.alloc(64, 7))

    await socket.close()
  })

  it('fails closed for malformed key, signature, and signer-error responses', async () => {
    const socket = await startSocket((request) => {
      if (request.method === 'GetActiveKey')
        return { ...key('active'), publicJwk: { ...key('active').publicJwk, crv: 'P-384' } }
      if (request.method === 'SignEs256') return { signatureBase64url: 'YQ' }
      return jsonRpcError('no')
    })
    const client = new UdsSignerClient(socket.path)

    await expect(client.activeSigningKey()).rejects.toThrow('invalid signer key response')
    await expect(client.signEs256('active', Buffer.from('a'))).rejects.toThrow(
      'invalid signer signature response'
    )
    await expect(client.publishedSigningKeys()).rejects.toThrow('invalid signer response')

    await socket.close()
  })
})

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

async function startSocket(
  handler: (request: { method: string; params: unknown }) => unknown
): Promise<{ path: string; close(): Promise<void> }> {
  const directory = mkdtempSync(join(tmpdir(), 'oes-uds-'))
  const path = join(directory, 'signer.sock')
  const server = createServer((connection) =>
    connection.on('data', (data) => {
      const request = JSON.parse(data.toString()) as { method: string; params: unknown }
      try {
        const result = handler(request)
        connection.end(
          `${JSON.stringify(isJsonRpcError(result) ? { jsonrpc: '2.0', id: 1, error: { message: result.message } } : { jsonrpc: '2.0', id: 1, result })}\n`
        )
      } catch (error) {
        connection.end(
          `${JSON.stringify({ jsonrpc: '2.0', id: 1, error: { message: error instanceof Error ? error.message : 'error' } })}\n`
        )
      }
    })
  )
  await new Promise<void>((resolve) => server.listen(path, resolve))
  return {
    path,
    close: async () => {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      )
      rmSync(directory, { recursive: true, force: true })
    }
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
