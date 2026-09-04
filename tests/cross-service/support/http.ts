import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

export type JourneyServer = Readonly<{
  origin: string
  close(): Promise<void>
}>

/** Starts an isolated loopback boundary on an operating-system assigned port. */
export async function listen(
  handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>
): Promise<JourneyServer> {
  const server = createServer((request, response) => {
    void Promise.resolve(handler(request, response)).catch((error) => {
      json(response, 500, { error: error instanceof Error ? error.message : String(error) })
    })
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve())
  })
  const address = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      )
  }
}

/** Reads and parses one bounded JSON request body. */
export async function readJson(request: IncomingMessage): Promise<Record<string, any>> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const value = Buffer.from(chunk)
    size += value.length
    if (size > 1_000_000) throw new Error('JOURNEY_REQUEST_TOO_LARGE')
    chunks.push(value)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

/** Sends a JSON boundary response with explicit no-store behavior. */
export function json(response: ServerResponse, status: number, body: unknown): void {
  const encoded = Buffer.from(JSON.stringify(body), 'utf8')
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(encoded.length),
    'cache-control': 'no-store'
  })
  response.end(encoded)
}

/** Sends one HTML document used by a headless browser Journey. */
export function html(response: ServerResponse, body: string, status = 200): void {
  response.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store'
  })
  response.end(body)
}
