#!/usr/bin/env node
import fs from 'node:fs'
import net from 'node:net'
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'

/** Starts a host-owned UDS facade whose connections are piped through exact-container docker exec. */
export function startUdsDockerProxy(environment = process.env) {
  const socketPath = environment.OES_PROXY_SOCKET_PATH?.trim()
  const container = environment.OES_PROXY_CONTAINER_NAME?.trim()
  if (!socketPath?.startsWith('/') || !/^oes-v2-[a-z0-9-]+-execution-signer$/u.test(container || '')) throw new Error('UDS_DOCKER_PROXY_CONFIGURATION_INVALID')
  if (fs.existsSync(socketPath)) throw new Error('UDS_DOCKER_PROXY_SOCKET_EXISTS')
  const bridges = new Set()
  const server = net.createServer((client) => {
    const bridge = spawn('docker', ['exec', '-i', container, 'socat', 'STDIO', 'UNIX-CONNECT:/execution-signer/container.sock'], { stdio: ['pipe', 'pipe', 'ignore'] })
    bridges.add(bridge)
    const close = () => { client.destroy(); if (bridge.exitCode === null) bridge.kill('SIGTERM') }
    client.on('error', close)
    bridge.on('error', close)
    bridge.on('exit', () => { bridges.delete(bridge); client.destroy() })
    client.pipe(bridge.stdin)
    bridge.stdout.pipe(client)
  })
  server.listen(socketPath, () => fs.chmodSync(socketPath, 0o600))
  const stop = () => {
    for (const bridge of bridges) if (bridge.exitCode === null) bridge.kill('SIGTERM')
    server.close(() => { fs.rmSync(socketPath, { force: true }); process.exit(0) })
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  return server
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) startUdsDockerProxy()
