import { strict as assert } from 'node:assert'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '../..')
const COMPOSE_FILE = join(REPO_ROOT, 'docker-compose.infra.yml')
const CONFIG_ONLY = process.argv.includes('--config-only')
const UNKNOWN_ARGS = process.argv.slice(2).filter((arg) => arg !== '--config-only')
const COMMAND_TIMEOUT_MS = 180_000
const READINESS_TIMEOUT_MS = 90_000
const abortController = new AbortController()

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => abortController.abort(new Error(`received ${signal}`)))
}

// Runs one subprocess with captured literal output and a bounded lifetime.
async function run(command, args, options = {}) {
  const {
    allowedExitCodes = [0],
    cwd = REPO_ROOT,
    env = process.env,
    ignoreAbort = false,
    input,
    timeoutMs = COMMAND_TIMEOUT_MS
  } = options

  return await new Promise((resolvePromise, rejectPromise) => {
    let timedOut = false
    let forceKillTimeout
    const child = spawn(command, args, {
      cwd,
      env,
      signal: ignoreAbort ? undefined : abortController.signal,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    const stdout = []
    const stderr = []
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      forceKillTimeout = setTimeout(() => child.kill('SIGKILL'), 5_000)
      forceKillTimeout.unref()
    }, timeoutMs)
    timeout.unref()

    child.stdout.on('data', (chunk) => stdout.push(chunk))
    child.stderr.on('data', (chunk) => stderr.push(chunk))
    child.on('error', (error) => {
      clearTimeout(timeout)
      clearTimeout(forceKillTimeout)
      rejectPromise(error)
    })
    child.on('close', (exitCode, signal) => {
      clearTimeout(timeout)
      clearTimeout(forceKillTimeout)
      const result = {
        command: [command, ...args].join(' '),
        exitCode,
        signal,
        stderr: Buffer.concat(stderr).toString('utf8'),
        stdout: Buffer.concat(stdout).toString('utf8')
      }
      if (!timedOut && allowedExitCodes.includes(exitCode)) {
        resolvePromise(result)
        return
      }

      const reason = timedOut
        ? `timed out after ${timeoutMs}ms`
        : `exited with ${exitCode ?? signal}`
      rejectPromise(
        new Error(
          `${result.command} ${reason}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
        )
      )
    })

    child.stdin.end(input)
  })
}

// Returns a Compose service model without requiring unrelated deployment secrets.
async function readComposeModel() {
  await run('docker', ['compose', '-f', COMPOSE_FILE, 'config', '--no-interpolate', '--quiet'])
  await run('docker', [
    'compose',
    '-f',
    join(REPO_ROOT, 'docker-compose.yml'),
    'config',
    '--no-interpolate',
    '--quiet'
  ])
  const result = await run('docker', [
    'compose',
    '-f',
    COMPOSE_FILE,
    'config',
    '--no-interpolate',
    '--format',
    'json'
  ])
  return JSON.parse(result.stdout)
}

// Verifies every observability bind mount that must be delivered by Git.
async function verifyRepositoryAssets(composeModel) {
  const expectedAssets = new Map([
    ['/etc/otelcol-contrib/config.yaml', join(REPO_ROOT, 'docker/otel/collector-config.yaml')],
    ['/etc/tempo/tempo.yaml', join(REPO_ROOT, 'docker/otel/tempo.yaml')],
    ['/etc/loki/loki.yaml', join(REPO_ROOT, 'docker/otel/loki.yaml')],
    [
      '/etc/grafana/provisioning/datasources',
      join(REPO_ROOT, 'docker/grafana/provisioning/datasources')
    ]
  ])

  for (const [target, expectedSource] of expectedAssets) {
    const matchingVolumes = Object.values(composeModel.services)
      .flatMap((service) => service.volumes ?? [])
      .filter((volume) => volume.type === 'bind' && volume.target === target)
    assert.equal(matchingVolumes.length, 1, `expected one bind mount for ${target}`)
    assert.equal(matchingVolumes[0].source, expectedSource)
    const sourceStat = await stat(expectedSource)
    if (target.endsWith('.yaml')) {
      assert.equal(sourceStat.isFile(), true, `${expectedSource} must be a file`)
    } else {
      assert.equal(sourceStat.isDirectory(), true, `${expectedSource} must be a directory`)
    }
  }

  const deliveredFiles = [
    'docker/otel/collector-config.yaml',
    'docker/otel/tempo.yaml',
    'docker/otel/loki.yaml',
    'docker/grafana/provisioning/datasources/datasources.yaml'
  ]
  for (const relativePath of deliveredFiles) {
    const ignored = await run('git', ['check-ignore', '--quiet', relativePath], {
      allowedExitCodes: [0, 1]
    })
    assert.equal(ignored.exitCode, 1, `${relativePath} must not be ignored`)
    const discoverable = await run('git', [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '--',
      relativePath
    ])
    assert.equal(discoverable.stdout.trim(), relativePath)
  }
}

// Uses each pinned image to reject invalid Collector, Tempo, or Loki configuration.
async function validateBackendConfigs(composeModel) {
  const images = Object.fromEntries(
    ['otel-collector', 'tempo', 'loki', 'grafana'].map((serviceName) => {
      const image = composeModel.services[serviceName]?.image
      assert.equal(typeof image, 'string', `missing image for ${serviceName}`)
      return [serviceName, image]
    })
  )

  await run('docker', [
    'run',
    '--rm',
    '--mount',
    `type=bind,src=${join(REPO_ROOT, 'docker/otel/collector-config.yaml')},dst=/etc/otelcol-contrib/config.yaml,readonly`,
    images['otel-collector'],
    'validate',
    '--config=/etc/otelcol-contrib/config.yaml'
  ])
  await run('docker', [
    'run',
    '--rm',
    '--mount',
    `type=bind,src=${join(REPO_ROOT, 'docker/otel/tempo.yaml')},dst=/etc/tempo/tempo.yaml,readonly`,
    images.tempo,
    '-config.file=/etc/tempo/tempo.yaml',
    '-config.verify=true'
  ])
  await run('docker', [
    'run',
    '--rm',
    '--mount',
    `type=bind,src=${join(REPO_ROOT, 'docker/otel/loki.yaml')},dst=/etc/loki/loki.yaml,readonly`,
    images.loki,
    '-config.file=/etc/loki/loki.yaml',
    '-verify-config=true'
  ])

  return images
}

// Waits until an asynchronous service assertion succeeds or reports its last error.
async function waitFor(label, assertion, timeoutMs = READINESS_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs
  let lastError
  while (Date.now() < deadline) {
    abortController.signal.throwIfAborted()
    try {
      return await assertion()
    } catch (error) {
      lastError = error
      await sleep(1_000, undefined, { signal: abortController.signal })
    }
  }
  throw new Error(`${label} did not become ready: ${lastError?.message ?? 'unknown'}`)
}

// Requests text and preserves the response body in any HTTP failure.
async function requestText(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.any([abortController.signal, AbortSignal.timeout(10_000)])
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}: ${text}`)
  }
  return text
}

// Requests JSON after applying the shared HTTP status handling.
async function requestJson(url, options = {}) {
  const text = await requestText(url, options)
  return text.length > 0 ? JSON.parse(text) : {}
}

// Resolves Docker's ephemeral localhost port for one container port.
async function publishedPort(containerName, containerPort) {
  const result = await run('docker', ['port', containerName, `${containerPort}/tcp`])
  const firstBinding = result.stdout.trim().split('\n')[0]
  const match = firstBinding.match(/:(\d+)$/)
  assert.ok(match, `unexpected Docker port binding: ${firstBinding}`)
  return Number(match[1])
}

// Starts one uniquely named container on the isolated smoke network.
async function startContainer(containers, name, args) {
  const existing = await run('docker', ['container', 'inspect', name], {
    allowedExitCodes: [0, 1]
  })
  assert.equal(existing.exitCode, 1, `container name already exists: ${name}`)
  containers.push(name)
  await run('docker', [
    'run',
    '--detach',
    '--pull=missing',
    '--name',
    name,
    '--label',
    'oes.smoke=observability',
    ...args
  ])
}

// Sends one deterministic OTLP/HTTP trace and proves Tempo can return it by ID.
async function verifyTraceRoundTrip(collectorBaseUrl, tempoBaseUrl, suffix) {
  const traceId = randomBytes(16).toString('hex')
  const spanId = randomBytes(8).toString('hex')
  const spanName = `oes-observability-smoke-${suffix}`
  const startTime = BigInt(Date.now()) * 1_000_000n
  const payload = {
    resourceSpans: [
      {
        resource: {
          attributes: [
            {
              key: 'service.name',
              value: { stringValue: 'oes-observability-smoke' }
            }
          ]
        },
        scopeSpans: [
          {
            scope: { name: 'oes-observability-smoke' },
            spans: [
              {
                endTimeUnixNano: String(startTime + 5_000_000n),
                kind: 1,
                name: spanName,
                spanId,
                startTimeUnixNano: String(startTime),
                status: { code: 1 },
                traceId
              }
            ]
          }
        ]
      }
    ]
  }

  await requestJson(`${collectorBaseUrl}/v1/traces`, {
    body: JSON.stringify(payload),
    headers: { 'content-type': 'application/json' },
    method: 'POST'
  })
  await waitFor('Tempo trace query', async () => {
    const trace = await requestJson(`${tempoBaseUrl}/api/traces/${traceId}`, {
      headers: { accept: 'application/json' }
    })
    assert.match(JSON.stringify(trace), new RegExp(spanName))
  })

  return traceId
}

// Writes one structured file log and proves Loki can return its unique marker.
async function verifyLogRoundTrip(logDirectory, lokiBaseUrl, suffix) {
  const marker = `oes-observability-log-${suffix}`
  const logPath = join(logDirectory, 'smoke.log')
  await writeFile(
    logPath,
    `${JSON.stringify({
      level: 'info',
      message: marker,
      service: 'oes-observability-smoke',
      timestamp: new Date().toISOString()
    })}\n`,
    'utf8'
  )

  const start = BigInt(Date.now() - 60_000) * 1_000_000n
  const end = BigInt(Date.now() + 60_000) * 1_000_000n
  const params = new URLSearchParams({
    direction: 'backward',
    end: String(end),
    limit: '20',
    query: `{service_name="oes-observability-smoke"} |= "${marker}"`,
    start: String(start)
  })
  await waitFor('Loki log query', async () => {
    const result = await requestJson(`${lokiBaseUrl}/loki/api/v1/query_range?${params}`)
    assert.equal(result.status, 'success')
    assert.match(JSON.stringify(result.data?.result ?? []), new RegExp(marker))
  })

  return marker
}

// Confirms Grafana provisioned both backends with the expected internal URLs.
async function verifyGrafana(grafanaBaseUrl, username, password) {
  const authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  await waitFor('Grafana health', async () => {
    const health = await requestJson(`${grafanaBaseUrl}/api/health`)
    assert.equal(health.database, 'ok')
  })
  const tempo = await requestJson(`${grafanaBaseUrl}/api/datasources/uid/tempo`, {
    headers: { authorization }
  })
  const loki = await requestJson(`${grafanaBaseUrl}/api/datasources/uid/loki`, {
    headers: { authorization }
  })
  assert.equal(tempo.url, 'http://tempo:3200')
  assert.equal(loki.url, 'http://loki:3100')
}

// Captures bounded logs from task-owned containers before cleanup after a failure.
async function captureFailureLogs(containers) {
  const reports = []
  for (const container of containers) {
    const result = await run('docker', ['logs', '--tail', '200', container], {
      allowedExitCodes: [0, 1],
      ignoreAbort: true,
      timeoutMs: 15_000
    })
    reports.push(`===== ${container} =====\n${result.stdout}${result.stderr}`.trimEnd())
  }
  return reports.join('\n')
}

// Removes only the exact smoke containers, network, and temporary log directory.
async function cleanup(containers, networkName, tempDirectory) {
  for (const container of [...containers].reverse()) {
    await run('docker', ['rm', '--force', container], {
      allowedExitCodes: [0, 1],
      ignoreAbort: true,
      timeoutMs: 30_000
    })
    const remaining = await run('docker', ['container', 'inspect', container], {
      allowedExitCodes: [0, 1],
      ignoreAbort: true,
      timeoutMs: 15_000
    })
    assert.equal(remaining.exitCode, 1, `container cleanup failed: ${container}`)
  }
  if (networkName) {
    await run('docker', ['network', 'rm', networkName], {
      allowedExitCodes: [0, 1],
      ignoreAbort: true,
      timeoutMs: 30_000
    })
    const remaining = await run('docker', ['network', 'inspect', networkName], {
      allowedExitCodes: [0, 1],
      ignoreAbort: true,
      timeoutMs: 15_000
    })
    assert.equal(remaining.exitCode, 1, `network cleanup failed: ${networkName}`)
  }
  if (tempDirectory) {
    await rm(tempDirectory, { force: true, recursive: true })
  }
}

// Runs the isolated trace, log, and Grafana provisioning verification journey.
async function runRoundTripSmoke(images) {
  const suffix = `${process.pid}-${randomBytes(4).toString('hex')}`
  const networkName = `oes-observability-smoke-${suffix}`
  const tempDirectory = await mkdtemp(join(tmpdir(), 'oes-observability-smoke-'))
  const logDirectory = join(tempDirectory, 'logs')
  const containers = []
  const names = {
    collector: `${networkName}-collector`,
    grafana: `${networkName}-grafana`,
    loki: `${networkName}-loki`,
    tempo: `${networkName}-tempo`
  }
  const grafanaUsername = 'smoke-admin'
  const grafanaPassword = randomBytes(18).toString('base64url')
  let failure
  let cleanupFailure
  let networkCreated = false

  await mkdir(logDirectory, { recursive: true })
  try {
    const existingNetwork = await run('docker', ['network', 'inspect', networkName], {
      allowedExitCodes: [0, 1]
    })
    assert.equal(existingNetwork.exitCode, 1, `network name already exists: ${networkName}`)
    await run('docker', ['network', 'create', networkName])
    networkCreated = true
    await startContainer(containers, names.tempo, [
      '--network',
      networkName,
      '--network-alias',
      'tempo',
      '--publish',
      '127.0.0.1::3200',
      '--tmpfs',
      '/tmp/tempo:rw,mode=1777',
      '--mount',
      `type=bind,src=${join(REPO_ROOT, 'docker/otel/tempo.yaml')},dst=/etc/tempo/tempo.yaml,readonly`,
      images.tempo,
      '-config.file=/etc/tempo/tempo.yaml'
    ])
    await startContainer(containers, names.loki, [
      '--network',
      networkName,
      '--network-alias',
      'loki',
      '--publish',
      '127.0.0.1::3100',
      '--tmpfs',
      '/tmp/loki:rw,mode=1777',
      '--mount',
      `type=bind,src=${join(REPO_ROOT, 'docker/otel/loki.yaml')},dst=/etc/loki/loki.yaml,readonly`,
      images.loki,
      '-config.file=/etc/loki/loki.yaml'
    ])

    const tempoBaseUrl = `http://127.0.0.1:${await publishedPort(names.tempo, 3200)}`
    const lokiBaseUrl = `http://127.0.0.1:${await publishedPort(names.loki, 3100)}`
    await Promise.all([
      waitFor('Tempo readiness', () => requestText(`${tempoBaseUrl}/ready`)),
      waitFor('Loki readiness', () => requestText(`${lokiBaseUrl}/ready`))
    ])

    await startContainer(containers, names.collector, [
      '--network',
      networkName,
      '--network-alias',
      'otel-collector',
      '--publish',
      '127.0.0.1::4318',
      '--publish',
      '127.0.0.1::13133',
      '--mount',
      `type=bind,src=${join(REPO_ROOT, 'docker/otel/collector-config.yaml')},dst=/etc/otelcol-contrib/config.yaml,readonly`,
      '--mount',
      `type=bind,src=${logDirectory},dst=/var/log/oes`,
      images['otel-collector'],
      '--config=/etc/otelcol-contrib/config.yaml'
    ])
    const collectorBaseUrl = `http://127.0.0.1:${await publishedPort(names.collector, 4318)}`
    const collectorHealthUrl = `http://127.0.0.1:${await publishedPort(names.collector, 13133)}`
    await waitFor('Collector health', () => requestText(collectorHealthUrl))

    await startContainer(containers, names.grafana, [
      '--network',
      networkName,
      '--network-alias',
      'grafana',
      '--publish',
      '127.0.0.1::3000',
      '--tmpfs',
      '/var/lib/grafana:rw,mode=1777',
      '--env',
      `GF_SECURITY_ADMIN_USER=${grafanaUsername}`,
      '--env',
      `GF_SECURITY_ADMIN_PASSWORD=${grafanaPassword}`,
      '--env',
      'GF_AUTH_ANONYMOUS_ENABLED=false',
      '--mount',
      `type=bind,src=${join(REPO_ROOT, 'docker/grafana/provisioning/datasources')},dst=/etc/grafana/provisioning/datasources,readonly`,
      images.grafana
    ])
    const grafanaBaseUrl = `http://127.0.0.1:${await publishedPort(names.grafana, 3000)}`

    await verifyGrafana(grafanaBaseUrl, grafanaUsername, grafanaPassword)
    const traceId = await verifyTraceRoundTrip(collectorBaseUrl, tempoBaseUrl, suffix)
    const marker = await verifyLogRoundTrip(logDirectory, lokiBaseUrl, suffix)
    console.log(`PASS trace round trip: ${traceId}`)
    console.log(`PASS log round trip: ${marker}`)
    console.log('PASS Grafana datasource provisioning: tempo, loki')
  } catch (error) {
    failure = error
    const logs = await captureFailureLogs(containers)
    if (logs.length > 0) {
      console.error(logs)
    }
  } finally {
    try {
      await cleanup(containers, networkCreated ? networkName : undefined, tempDirectory)
      console.log('PASS isolated smoke cleanup')
    } catch (error) {
      cleanupFailure = error
    }
  }

  if (failure && cleanupFailure) {
    throw new AggregateError([failure, cleanupFailure], 'smoke and cleanup both failed')
  }
  if (cleanupFailure) {
    throw cleanupFailure
  }
  if (failure) {
    throw failure
  }
}

// Executes static delivery checks and, unless requested otherwise, the live journey.
async function main() {
  assert.deepEqual(UNKNOWN_ARGS, [], `unknown arguments: ${UNKNOWN_ARGS.join(', ')}`)
  await run('docker', ['info', '--format', '{{.ServerVersion}}'])
  const composeModel = await readComposeModel()
  await verifyRepositoryAssets(composeModel)
  const images = await validateBackendConfigs(composeModel)
  console.log('PASS repository assets and Compose model')
  console.log('PASS Collector, Tempo, and Loki config validation')
  if (!CONFIG_ONLY) {
    await runRoundTripSmoke(images)
  }
}

main().catch((error) => {
  console.error(error.stack ?? error.message)
  process.exitCode = 1
})
