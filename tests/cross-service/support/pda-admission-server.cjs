require('ts-node/register/transpile-only')

const { createServer } = require('node:http')
const {
  LoginUseCase
} = require('../../../src/services/api-gateway/src/modules/auth-bff/application/use-cases/login.use-case.ts')
const {
  TerminalDeviceCredentialVerifierService
} = require('../../../src/services/system/terminal-device-service/src/application/services/terminal-device-credential-verifier.service.ts')
const {
  TerminalDeviceEntity
} = require('../../../src/services/system/terminal-device-service/src/domain/entities/terminal-device.entity.ts')
const { LoginStatus } = require('../../../src/common/dist/generated/index.auth_service.js')

const tenantId = 'journey-pda-tenant'
const terminalDeviceId = 'journey-pda-terminal'
const appInstallationId = 'journey-robolectric-installation'
const verifier = new TerminalDeviceCredentialVerifierService()
const issued = verifier.issue(new Date('2026-09-04T00:00:00.000Z'))
const device = new TerminalDeviceEntity({
  terminalDeviceId,
  tenantId,
  terminalDeviceType: 'PDA',
  displayName: 'Robolectric PDA',
  status: 'ACTIVE',
  statusReason: null,
  enrollmentId: 'journey-enrollment',
  manufacturerSerial: null,
  androidId: null,
  appInstallationId,
  deviceCredentialHash: issued.hash,
  deviceCredentialExpiresAt: issued.expiresAt,
  manufacturer: 'Robolectric',
  model: 'JVM',
  androidVersion: '14',
  registeredAt: new Date('2026-09-04T00:00:00.000Z'),
  updatedAt: new Date('2026-09-04T00:00:00.000Z'),
  notes: null
})

const terminalDeviceAdapter = {
  async resolveLoginDeviceContext(input) {
    try {
      verifier.verify(
        device,
        input.deviceCredential,
        input.deviceMetadata.appInstallationId,
        new Date('2026-09-04T01:00:00.000Z')
      )
      return {
        allowed: input.terminalDeviceId === terminalDeviceId,
        terminalDeviceId,
        deviceBoundTenantId: tenantId,
        resolvedTenantId: tenantId,
        deviceStatus: 'ACTIVE',
        reasonCode:
          input.terminalDeviceId === terminalDeviceId ? 'DEVICE_ALLOWED' : 'DEVICE_ID_MISMATCH'
      }
    } catch {
      return {
        allowed: false,
        terminalDeviceId,
        deviceBoundTenantId: tenantId,
        resolvedTenantId: tenantId,
        deviceStatus: 'ACTIVE',
        reasonCode: 'TERMINAL_DEVICE_CREDENTIAL_INVALID'
      }
    }
  }
}

const authAdapter = {
  async loginWithEmailPassword(input) {
    if (input.email !== 'operator@example.test' || input.password !== 'journey-password') {
      return {
        status: LoginStatus.LOGIN_STATUS_DENIED,
        reasonCode: 'AUTH_INVALID_CREDENTIALS'
      }
    }
    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      accessToken: 'pda-access-token',
      refreshToken: 'pda-refresh-token',
      expiresIn: '900',
      terminal: 'PDA',
      terminalDeviceId,
      deviceBoundTenantId: tenantId,
      userId: 'journey-pda-user',
      accountId: 'journey-pda-account',
      tenantId,
      scopeLevel: 'TENANT',
      displayName: 'PDA Operator',
      allowedTerminals: ['PDA']
    }
  }
}

const useCase = new LoginUseCase(authAdapter, undefined, terminalDeviceAdapter, undefined)
const server = createServer(async (request, response) => {
  if (request.method !== 'POST' || request.url !== '/api/v1/pda/auth/login') {
    response.writeHead(404).end()
    return
  }
  const chunks = []
  for await (const chunk of request) chunks.push(Buffer.from(chunk))
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
  const result = await useCase.execute(
    body,
    { requestId: 'pda-journey-request', traceId: 'pda-journey-trace' },
    { userAgent: 'Robolectric', ipAddress: '127.0.0.1' },
    'PDA',
    request.headers['x-oes-device-credential']
  )
  response.writeHead(200, { 'content-type': 'application/json' })
  response.end(JSON.stringify(result))
})

server.listen(0, '127.0.0.1', () => {
  const address = server.address()
  process.stdout.write(
    `${JSON.stringify({
      origin: `http://127.0.0.1:${address.port}`,
      terminalDeviceId,
      appInstallationId,
      credential: issued.credential
    })}\n`
  )
})

process.on('SIGTERM', () => server.close(() => process.exit(0)))
