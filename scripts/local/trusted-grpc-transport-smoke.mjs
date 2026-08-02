import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readdir, readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { connect, createServer } from 'node:tls'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const trustDirectory = resolve(repositoryRoot, 'docker/grpc-trust')
const bootstrapScript = resolve(trustDirectory, 'bootstrap-local-trust.sh')

/** run executes a command with bounded output for the transport acceptance flow. */
async function run(command, arguments_, options = {}) {
  return execFileAsync(command, arguments_, {
    ...options,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
}

/** readCertificateFingerprint returns the canonical SHA-256 certificate fingerprint used by the smoke binding check. */
async function readCertificateFingerprint(certificatePath) {
  const { stdout } = await run('openssl', [
    'x509',
    '-in',
    certificatePath,
    '-noout',
    '-fingerprint',
    '-sha256',
  ])
  return stdout.trim().split('=')[1]
}

/** readWorkloadIdentity loads the certificate material exposed to one isolated workload mount. */
async function readWorkloadIdentity(workspace, workload) {
  const directory = resolve(workspace, workload, 'current')
  const [ca, cert, key] = await Promise.all([
    readFile(resolve(directory, 'ca.pem')),
    readFile(resolve(directory, 'cert.pem')),
    readFile(resolve(directory, 'key.pem')),
  ])
  return { ca, cert, directory, key, workload }
}

/** readPeerSpiffeId extracts the URI SAN supplied by the peer during the authenticated TLS handshake. */
function readPeerSpiffeId(peerCertificate) {
  return peerCertificate.subjectaltname
    ?.split(', ')
    .find((entry) => entry.startsWith('URI:'))
    ?.slice('URI:'.length)
}

/** startMtlsServer accepts only the expected SPIFFE ID and leaf fingerprint after mutual TLS verification. */
async function startMtlsServer(serverIdentity, expectedSpiffeId, expectedFingerprint) {
  const server = createServer(
    {
      ca: serverIdentity.ca,
      cert: serverIdentity.cert,
      key: serverIdentity.key,
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
      requestCert: true,
    },
    (socket) => {
      const peerCertificate = socket.getPeerCertificate(true)
      if (readPeerSpiffeId(peerCertificate) !== expectedSpiffeId) {
        socket.end('REJECT:SPIFFE_ID')
        return
      }
      if (peerCertificate.fingerprint256 !== expectedFingerprint) {
        socket.end('REJECT:CERTIFICATE_BINDING')
        return
      }
      socket.end('ACCEPT')
    },
  )
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen)
    server.listen(0, '127.0.0.1', resolveListen)
  })
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  return {
    port: address.port,
    close: () => new Promise((resolveClose, rejectClose) => server.close((error) => (error ? rejectClose(error) : resolveClose()))),
  }
}

/** callMtlsServer establishes a real mutual-TLS client connection and returns the policy result from the test server. */
async function callMtlsServer(clientIdentity, serverName, port) {
  return new Promise((resolveCall, rejectCall) => {
    let response = ''
    const socket = connect({
      ca: clientIdentity.ca,
      cert: clientIdentity.cert,
      host: '127.0.0.1',
      key: clientIdentity.key,
      port,
      rejectUnauthorized: true,
      servername: serverName,
    })
    socket.setEncoding('utf8')
    socket.on('data', (chunk) => {
      response += chunk
    })
    socket.once('error', rejectCall)
    socket.once('end', () => resolveCall(response))
  })
}

/** main verifies that the local deployment foundation can issue and rotate isolated workload certificates. */
async function main() {
  const environments = JSON.parse(await readFile(resolve(trustDirectory, 'environments.json'), 'utf8'))
  const values = Object.values(environments)
  assert.deepEqual(Object.keys(environments).sort(), ['local', 'production', 'staging'])
  assert.equal(new Set(values.map((environment) => environment.trustDomain)).size, values.length)
  assert.equal(new Set(values.map((environment) => environment.issuer)).size, values.length)
  assert.equal(new Set(values.map((environment) => environment.signingKeySecretRef)).size, values.length)
  assert.ok(environments.local.leafTtlSeconds <= 24 * 60 * 60)
  assert.equal(environments.local.renewBeforeLifetimeFraction, '2/3')
  await assert.rejects(
    run('bash', [bootstrapScript, '--output', resolve(tmpdir(), 'oes-staging-trust-must-not-exist')], {
      env: { ...process.env, OES_TRUST_ENV: 'staging' },
    }),
    /only creates the local trust domain/,
  )

  const workspace = await mkdtemp(resolve(tmpdir(), 'oes-trusted-grpc-'))
  try {
    await run('bash', [bootstrapScript, '--output', workspace], {
      env: { ...process.env, OES_TRUST_ENV: 'local' },
    })

    const clientIdentity = await readWorkloadIdentity(workspace, 'grpc-transport-smoke-client')
    const rogueIdentity = await readWorkloadIdentity(workspace, 'grpc-transport-smoke-rogue')
    const serverIdentity = await readWorkloadIdentity(workspace, 'grpc-transport-smoke-server')
    const clientCertificate = resolve(clientIdentity.directory, 'cert.pem')
    const beforeRotation = await readCertificateFingerprint(clientCertificate)
    const expectedClientSpiffeId = `${environments.local.trustDomain}/ns/oes/sa/${clientIdentity.workload}`
    const serverName = serverIdentity.workload
    let endpoint = await startMtlsServer(serverIdentity, expectedClientSpiffeId, beforeRotation)
    try {
      assert.equal(await callMtlsServer(clientIdentity, serverName, endpoint.port), 'ACCEPT')
      assert.equal(await callMtlsServer(rogueIdentity, serverName, endpoint.port), 'REJECT:SPIFFE_ID')
    } finally {
      await endpoint.close()
    }

    await run('bash', [bootstrapScript, '--output', workspace], {
      env: { ...process.env, OES_FORCE_RENEW: 'true', OES_TRUST_ENV: 'local' },
    })
    const afterRotation = await readCertificateFingerprint(clientCertificate)
    assert.notEqual(afterRotation, beforeRotation, 'forced renewal must replace the workload leaf certificate')
    const clientLeafDirectories = (await readdir(resolve(workspace, clientIdentity.workload))).filter((entry) =>
      entry.startsWith('.leaf.'),
    )
    assert.equal(clientLeafDirectories.length, 1, 'rotation must not retain a superseded private leaf directory')

    const rotatedClientIdentity = await readWorkloadIdentity(workspace, 'grpc-transport-smoke-client')
    endpoint = await startMtlsServer(serverIdentity, expectedClientSpiffeId, beforeRotation)
    try {
      assert.equal(
        await callMtlsServer(rotatedClientIdentity, serverName, endpoint.port),
        'REJECT:CERTIFICATE_BINDING',
      )
    } finally {
      await endpoint.close()
    }
    endpoint = await startMtlsServer(serverIdentity, expectedClientSpiffeId, afterRotation)
    try {
      assert.equal(await callMtlsServer(rotatedClientIdentity, serverName, endpoint.port), 'ACCEPT')
    } finally {
      await endpoint.close()
    }

    await run('openssl', [
      'x509',
      '-in',
      clientCertificate,
      '-noout',
      '-checkend',
      String(Math.floor(environments.local.leafTtlSeconds / 3)),
    ])
  } finally {
    await rm(workspace, { force: true, recursive: true })
  }
}

main().then(
  () => console.log('trusted gRPC transport smoke passed'),
  (error) => {
    console.error(error.stack || error)
    process.exitCode = 1
  },
)
