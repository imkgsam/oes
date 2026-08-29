#!/usr/bin/env node
import { createServer } from 'node:https'
import { request } from 'node:http'
import { readFileSync } from 'node:fs'

const allowed = new Set(['/.well-known/openid-configuration', '/.well-known/jwks.json'])
const listenPort = Number(process.env.OES_ISSUER_PORT)
const upstreamPort = Number(process.env.OES_AUTH_HTTP_PORT || 50051)

/** Publishes only Auth metadata and JWKS over the exact deployment TLS identity. */
const server = createServer({
  cert: readFileSync(process.env.OES_ISSUER_CERT_PATH),
  key: readFileSync(process.env.OES_ISSUER_KEY_PATH),
  minVersion: 'TLSv1.2'
}, (incoming, outgoing) => {
  if (incoming.method !== 'GET' || !allowed.has(incoming.url)) {
    outgoing.writeHead(404).end()
    return
  }
  const upstream = request({ hostname: '127.0.0.1', port: upstreamPort, path: incoming.url, method: 'GET', headers: { host: 'issuer.local.oes.internal' } }, (response) => {
    outgoing.writeHead(response.statusCode ?? 502, response.headers)
    response.pipe(outgoing)
  })
  upstream.on('error', () => outgoing.writeHead(503).end())
  upstream.end()
})

server.listen(listenPort, '127.0.0.1')
