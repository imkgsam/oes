#!/usr/bin/env node
import { createServer } from 'node:https'
import { request } from 'node:http'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const allowed = new Set(['/.well-known/openid-configuration', '/.well-known/jwks.json'])

/** Starts the local HTTPS issuer proxy and exposes only Auth metadata and JWKS. */
export function startIssuerServer(environment = process.env) {
  const listenPort = requirePort(environment.OES_ISSUER_PORT, 'OES_ISSUER_PORT')
  const upstreamPort = requirePort(environment.OES_AUTH_HTTP_PORT, 'OES_AUTH_HTTP_PORT')
  const server = createServer({
    cert: readFileSync(requireValue(environment.OES_ISSUER_CERT_PATH, 'OES_ISSUER_CERT_PATH')),
    key: readFileSync(requireValue(environment.OES_ISSUER_KEY_PATH, 'OES_ISSUER_KEY_PATH')),
    minVersion: 'TLSv1.2'
  }, (incoming, outgoing) => {
    if (incoming.method !== 'GET' || !allowed.has(incoming.url)) return void outgoing.writeHead(404).end()
    const upstream = request({ hostname: '127.0.0.1', port: upstreamPort, path: incoming.url, method: 'GET', headers: { host: 'issuer.local.oes.internal' } }, (response) => {
      outgoing.writeHead(response.statusCode ?? 502, response.headers)
      response.pipe(outgoing)
    })
    upstream.on('error', () => outgoing.writeHead(503).end())
    upstream.end()
  })
  server.listen(listenPort, '127.0.0.1')
  return server
}

function requirePort(value, name) {
  const port = Number(value)
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error(`${name}_INVALID`)
  return port
}

function requireValue(value, name) {
  if (!value?.trim()) throw new Error(`${name}_REQUIRED`)
  return value
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) startIssuerServer()
