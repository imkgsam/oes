import assert from 'node:assert/strict'
import { execFile, execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const APISIX_IMAGE =
  'apache/apisix:3.13.0-debian@sha256:c5c7a55ebb5c07abc210dbb963a37f41030e12c91d23bacedbaa168fec633bd7'

/** Runs the real Gateway HealthModule behind pinned APISIX and proves remove/recover health behavior. */
async function main() {
  const root = resolve(import.meta.dirname, '../..')
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'oes-gateway-apisix-'))
  const containerName = `oes-gateway-apisix-${process.pid}`
  let fixture = await startTcpFixture()
  let gateway
  try {
    process.env.GATEWAY_READINESS_TARGETS = `fixture=tcp://127.0.0.1:${fixture.port}`
    process.env.GATEWAY_READINESS_TIMEOUT_MS = '250'
    const [{ NestFactory }, { HealthModule }] = await Promise.all([
      import('@nestjs/core'),
      import('../../src/services/api-gateway/dist/health/health.module.js')
    ])
    gateway = await NestFactory.create(HealthModule, { logger: false })
    await gateway.listen(0, '0.0.0.0')
    const gatewayPort = gateway.getHttpServer().address().port
    const apisixConfig = await readFile(join(root, 'docker/apisix/apisix.yaml'), 'utf8')
    assert.match(apisixConfig, /api-gateway:9101/)
    await writeFile(
      join(temporaryDirectory, 'apisix.yaml'),
      apisixConfig.replaceAll('api-gateway:9101', `host.docker.internal:${gatewayPort}`),
      'utf8'
    )
    await runDocker([
      'run',
      '--detach',
      '--rm',
      '--name',
      containerName,
      '--label',
      'oes.local.owner=gateway-events',
      '--add-host',
      'host.docker.internal:host-gateway',
      '--publish',
      '127.0.0.1::9080',
      '--volume',
      `${join(root, 'docker/apisix/config.yaml')}:/usr/local/apisix/conf/config.yaml:ro`,
      '--volume',
      `${join(temporaryDirectory, 'apisix.yaml')}:/usr/local/apisix/conf/apisix.yaml:ro`,
      APISIX_IMAGE
    ])
    const apisixPort = await publishedPort(containerName)
    const apisixReady = await waitForResponse(
      `http://127.0.0.1:${apisixPort}/health/ready`,
      (response) => response.status === 200,
      15_000
    )
    assert.equal(apisixReady.body.ready, true)
    assert.match(apisixReady.headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/)

    await stopTcpFixture(fixture.server)
    const gatewayDown = await waitForResponse(
      `http://127.0.0.1:${gatewayPort}/health/ready`,
      (response) => response.status === 503,
      5_000
    )
    assert.equal(gatewayDown.body.ready, false)
    const apisixDown = await waitForResponse(
      `http://127.0.0.1:${apisixPort}/health/ready`,
      (response) => response.status === 502 || response.status === 503,
      10_000
    )

    fixture = await startTcpFixture(fixture.port)
    const gatewayRecovered = await waitForResponse(
      `http://127.0.0.1:${gatewayPort}/health/ready`,
      (response) => response.status === 200,
      5_000
    )
    const apisixRecovered = await waitForResponse(
      `http://127.0.0.1:${apisixPort}/health/ready`,
      (response) => response.status === 200,
      15_000
    )
    assert.equal(gatewayRecovered.body.ready, true)
    assert.equal(apisixRecovered.body.ready, true)

    console.log(
      JSON.stringify(
        {
          image: APISIX_IMAGE,
          gateway: {
            initial: apisixReady.status,
            dependencyDown: gatewayDown.status,
            recovered: gatewayRecovered.status
          },
          apisix: {
            initial: apisixReady.status,
            upstreamRemoved: apisixDown.status,
            recovered: apisixRecovered.status,
            requestId: 'present'
          }
        },
        null,
        2
      )
    )
  } finally {
    await runDocker(['rm', '--force', containerName], true)
    if (gateway) await gateway.close()
    await stopTcpFixture(fixture.server)
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
}

/** Starts one task-owned TCP dependency on a random or previously released loopback port. */
async function startTcpFixture(port = 0) {
  const server = createServer((socket) => socket.end())
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolvePromise)
  })
  return { server, port: server.address().port }
}

/** Closes a fixture without leaking a listener into later local validations. */
async function stopTcpFixture(server) {
  if (!server?.listening) return
  await new Promise((resolvePromise, reject) =>
    server.close((error) => (error ? reject(error) : resolvePromise()))
  )
}

/** Resolves the random loopback port assigned to the APISIX container. */
async function publishedPort(containerName) {
  const { stdout } = await execFileAsync('docker', ['port', containerName, '9080/tcp'])
  const match = stdout.trim().match(/:(\d+)$/)
  assert.ok(match, `unexpected Docker port output: ${stdout}`)
  return Number(match[1])
}

/** Polls one HTTP endpoint until its literal status satisfies the expected health transition. */
async function waitForResponse(url, predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let last
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) })
      const text = await response.text()
      let body = text
      try {
        body = JSON.parse(text)
      } catch {}
      last = { status: response.status, headers: response.headers, body }
      if (predicate(last)) return last
    } catch (error) {
      last = error
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250))
  }
  throw new Error(`HTTP_TRANSITION_TIMEOUT:${url}:${JSON.stringify(last)}`)
}

/** Executes only the fixed Docker lifecycle used by this owner-local smoke. */
async function runDocker(arguments_, ignoreFailure = false) {
  try {
    return execFileSync('docker', arguments_, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    })
  } catch (error) {
    if (ignoreFailure) return ''
    throw error
  }
}

await main()
