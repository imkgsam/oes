import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const dependencyCandidate = '7a5df0a61315667e8966b4161f08b8fa71c7bd0c'
const integrationBase = '40c11d19b4fe8e33a1e7bae9ab855280ab3088b2'

const commands = [
  ['pnpm', ['proto:gen']],
  ['node', ['scripts/architecture/trusted-grpc-runtime-inventory.mjs']],
  ['node', ['scripts/architecture/trusted-grpc-signature-inventory.mjs']],
  ['node', ['--test', 'scripts/architecture/trusted-grpc-runtime-inventory.spec.mjs']],
  ['pnpm', ['common:build']],
  ['pnpm', ['prisma:generate:all']],
  [
    'pnpm',
    [
      'exec',
      'jest',
      '--runInBand',
      '--verbose',
      '--config',
      '{"rootDir":".","testEnvironment":"node","testRegex":"src/common/dist/(authorization/(guards/(trusted-execution.guard|trusted-internal-execution.guard|tenant-target-admission.guard)|interceptors/grpc-request-context.interceptor|trusted-execution/(execution-token-verifier|trusted-grpc-metadata-provider|trusted-execution-context|inbound-execution-token-credential.scope|tenant-target-admission|internal-trusted-grpc-caller))|transport/grpc/(grpc-js-mtls|grpc-workload-identity.provider))\\\\.spec\\\\.js$"}'
    ]
  ],
  ['node', ['scripts/local/trusted-grpc-transport-smoke.mjs']],
  [
    'pnpm',
    [
      '--filter',
      'browser-activity-service',
      '--filter',
      'collaboration-service',
      '--filter',
      'item-master-service',
      '--filter',
      'mes-service',
      '--filter',
      'party-service',
      '--filter',
      'public-entry-service',
      '--filter',
      'srm-service',
      '-r',
      'run',
      'build'
    ]
  ],
  [
    'pnpm',
    [
      '--filter',
      'public-entry-service',
      'exec',
      'jest',
      '--config',
      'jest.config.js',
      '--runInBand',
      'test/l1/business-card.module.spec.ts'
    ]
  ]
]

/** Runs one exact acceptance command with inherited literal output and captures its exit status. */
function run(command, arguments_) {
  return new Promise((resolveRun, rejectRun) => {
    console.log(`\n$ ${[command, ...arguments_].join(' ')}`)
    const child = spawn(command, arguments_, {
      cwd: repositoryRoot,
      env: process.env,
      stdio: 'inherit'
    })
    child.once('error', rejectRun)
    child.once('exit', (status, signal) => {
      console.log(`exit=${status ?? `signal:${signal}`}`)
      if (status === 0) resolveRun()
      else rejectRun(new Error(`${command} failed with ${status ?? signal}`))
    })
  })
}

/** Runs the complete task-local trusted foundation acceptance group in dependency order. */
async function main() {
  for (const [command, arguments_] of commands) await run(command, arguments_)
  console.log(
    JSON.stringify({
      dependencyCandidate,
      integrationBase,
      inventory: 'GATEWAY_1_SERVICES_21_MTLS_21_PORTS_UNIQUE',
      executionToken: 'VALID_ACCEPTED_INVALID_EXPIRED_WRONG_BINDINGS_REJECTED',
      trustedContext: 'TENANT_ORG_OPERATOR_TRACE_AUDIT_PRIVATE_PROPAGATION_VERIFIED',
      certificates: 'VALID_ACCEPTED_MISSING_EXPIRED_WRONG_WORKLOAD_ROTATED_REPLAY_REJECTED',
      result: 'FOUNDATION_TRUSTED_RUNTIME_ACCEPTED'
    })
  )
}

main().catch((error) => {
  console.error(error.stack || error)
  process.exitCode = 1
})
