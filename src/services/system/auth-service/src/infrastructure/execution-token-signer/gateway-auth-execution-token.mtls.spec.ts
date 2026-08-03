import {
  ChannelCredentials,
  Client,
  credentials,
  loadPackageDefinition,
  Server,
  ServerCredentials,
  status
} from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  createTrustedExecutionContext,
  type TrustedExecutionContext
} from '@oes/common/authorization'
import { createHash, generateKeyPairSync, sign, X509Certificate } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import {
  ExecutionTokenSigningKey,
  ExecutionTokenSigningPort
} from '../../domain/ports/execution-token-signing.port'
import { ExecutionTokenRegistry } from '../../domain/services/execution-token-registry'
import { ExecutionTokenExchangeService } from '../../application/services/execution-token-exchange.service'
import { createVerifiedExecutionTokenContext } from './execution-token-context-bootstrap'

const ASSET_AUDIENCE = 'urn:oes:service:asset-service'
const GATEWAY_SPIFFE_ID = 'spiffe://local.oes.internal/ns/oes/sa/api-gateway'
let trustRoot: string

type ExchangeRequest = {
  readonly targetAudience: string
  readonly requestedPermissionCodes: readonly string[]
}

type ExchangeResponse = {
  readonly accessToken: string
  readonly grantedAudience: string
  readonly grantedPermissionCodes: readonly string[]
}

type ExecutionTokenClient = Client & {
  exchangeExecutionToken(
    request: ExchangeRequest,
    callback: (error: Error | null, response?: ExchangeResponse) => void
  ): void
}

type WorkloadIdentityFiles = Readonly<{
  ca: Buffer
  cert: Buffer
  key: Buffer
}>

/** Supplies isolated P-256 signing material so the mTLS exchange exercises real JWT issuance. */
class IntegrationExecutionTokenSigner implements ExecutionTokenSigningPort {
  private readonly pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  private readonly key: ExecutionTokenSigningKey = {
    kid: 'auth-mtls-integration',
    publicJwk: this.pair.publicKey.export({ format: 'jwk' }),
    publishNotBeforeUnixSeconds: 1_700_000_000,
    signingNotBeforeUnixSeconds: 1_700_000_300,
    retireAfterUnixSeconds: 1_700_000_660
  }

  /** Returns the one integration key eligible at the frozen test clock. */
  async currentSigningKey(): Promise<ExecutionTokenSigningKey> {
    return this.key
  }

  /** Publishes the same integration key used for signing. */
  async publishedKeys(): Promise<readonly ExecutionTokenSigningKey[]> {
    return [this.key]
  }

  /** Produces the fixed-width ES256 signature expected by the Auth exchange service. */
  async sign(kid: string, input: Uint8Array): Promise<Uint8Array> {
    if (kid !== this.key.kid) throw new Error('unexpected signing key')
    return sign('sha256', input, { key: this.pair.privateKey, dsaEncoding: 'ieee-p1363' })
  }
}

/** Proves the Auth STS exchange over real Gateway mTLS remains bound to workload, audience, cnf, and Common authority. */
describe('Gateway to Auth ExecutionToken mTLS exchange', () => {
  const repositoryRoot = resolve(__dirname, '../../../../../../..')
  const contextAccessor = new AsyncLocalTrustedExecutionContextAccessor()
  const authority = createTrustedExecutionContext({
    subject: 'account-asset-user',
    principalType: 'HUMAN',
    tenantId: 'tenant-asset',
    sessionId: 'session-asset',
    requestId: 'request-asset',
    traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
  })
  let activeAuthority: TrustedExecutionContext | undefined = authority
  let server: Server
  let gatewayClient: ExecutionTokenClient
  let rogueClient: ExecutionTokenClient
  let gatewayIdentity: WorkloadIdentityFiles

  beforeAll(async () => {
    trustRoot = mkdtempSync(resolve(tmpdir(), 'oes-auth-mtls-exchange-'))
    execFileSync(
      'bash',
      [
        resolve(repositoryRoot, 'docker/grpc-trust/bootstrap-local-trust.sh'),
        '--output',
        trustRoot
      ],
      {
        env: { ...process.env, OES_TRUST_ENV: 'local' },
        stdio: 'pipe'
      }
    )
    const authIdentity = readWorkloadIdentity('auth-service')
    gatewayIdentity = readWorkloadIdentity('api-gateway')
    const rogueIdentity = readWorkloadIdentity('identity-service')
    const definition = loadSync(
      resolve(repositoryRoot, 'src/common/src/contracts/auth_service/execution_token.proto'),
      {
        defaults: true,
        enums: String,
        keepCase: false,
        longs: String,
        oneofs: true
      }
    )
    const authPackage = (loadPackageDefinition(definition) as Record<string, any>).auth_service
    const serviceDefinition = authPackage.ExecutionTokenService.service
    const ClientConstructor = authPackage.ExecutionTokenService as new (
      address: string,
      channelCredentials: ChannelCredentials,
      options: Record<string, string>
    ) => ExecutionTokenClient
    const context = createVerifiedExecutionTokenContext(
      {
        issuer: 'https://auth.local.oes.example',
        workloadPolicies: [
          {
            spiffeId: GATEWAY_SPIFFE_ID,
            audiences: [ASSET_AUDIENCE]
          }
        ]
      },
      contextAccessor
    )
    const exchange = new ExecutionTokenExchangeService(
      new ExecutionTokenRegistry({
        issuer: 'https://auth.local.oes.example',
        workloadPolicies: [
          {
            spiffeId: GATEWAY_SPIFFE_ID,
            audiences: [ASSET_AUDIENCE]
          }
        ]
      }),
      new IntegrationExecutionTokenSigner(),
      () => 1_700_000_300
    )

    server = new Server()
    server.addService(serviceDefinition, {
      exchangeExecutionToken: (
        call: any,
        callback: (error: Error | null, value?: unknown) => void
      ) => {
        const execute = async () => {
          const request: ExchangeRequest = call.request
          const verified = await context.resolve(call, request)
          const result = await exchange.exchange({ ...request, ...verified })
          return {
            accessToken: result.accessToken,
            tokenType: result.tokenType,
            expiresAtUnixSeconds: String(result.expiresAtUnixSeconds),
            expiresInSeconds: String(result.expiresInSeconds),
            kid: result.kid,
            grantedPermissionCodes: [...result.grantedPermissionCodes],
            grantedAudience: result.grantedAudience
          }
        }
        const operation = activeAuthority
          ? contextAccessor.run(activeAuthority, execute)
          : execute()
        operation.then(
          (value) => callback(null, value),
          (error) => callback(toGrpcError(error))
        )
      },
      getExecutionTokenJwks: (_call: unknown, callback: (error: Error | null) => void) =>
        callback(toGrpcError(new Error('not used')))
    })
    const port = await bindServer(server, authIdentity)
    const options = {
      'grpc.ssl_target_name_override': 'auth-service',
      'grpc.default_authority': 'auth-service'
    }
    gatewayClient = new ClientConstructor(
      `127.0.0.1:${port}`,
      createClientCredentials(gatewayIdentity),
      options
    )
    rogueClient = new ClientConstructor(
      `127.0.0.1:${port}`,
      createClientCredentials(rogueIdentity),
      options
    )
  }, 30_000)

  afterEach(() => {
    activeAuthority = authority
  })

  afterAll(() => {
    gatewayClient?.close()
    rogueClient?.close()
    server?.forceShutdown()
    if (trustRoot) rmSync(trustRoot, { force: true, recursive: true })
  })

  it('issues an Asset SELF_SERVICE token to the registered Gateway leaf certificate', async () => {
    const response = await exchangeToken(gatewayClient, {
      targetAudience: ASSET_AUDIENCE,
      requestedPermissionCodes: []
    })
    const claims = decodeClaims(response.accessToken)
    const expectedThumbprint = createHash('sha256')
      .update(new X509Certificate(gatewayIdentity.cert).raw)
      .digest('base64url')

    expect(response.grantedAudience).toBe(ASSET_AUDIENCE)
    expect(response.grantedPermissionCodes).toEqual([])
    expect(claims).toEqual(
      expect.objectContaining({
        aud: ASSET_AUDIENCE,
        client_id: GATEWAY_SPIFFE_ID,
        sub: 'account-asset-user',
        tenant_id: 'tenant-asset',
        scope: '',
        cnf: { 'x5t#S256': expectedThumbprint }
      })
    )
  })

  it('rejects the wrong workload, audience, and missing Common authority', async () => {
    await expect(
      exchangeToken(rogueClient, {
        targetAudience: ASSET_AUDIENCE,
        requestedPermissionCodes: []
      })
    ).rejects.toThrow('Workload identity is not registered')
    await expect(
      exchangeToken(gatewayClient, {
        targetAudience: 'urn:oes:service:permission-service',
        requestedPermissionCodes: []
      })
    ).rejects.toThrow('target audience')

    activeAuthority = undefined
    await expect(
      exchangeToken(gatewayClient, {
        targetAudience: ASSET_AUDIENCE,
        requestedPermissionCodes: []
      })
    ).rejects.toThrow('verified execution context is unavailable')
  })
})

/** Loads one local workload's isolated CA, leaf certificate, and private key. */
function readWorkloadIdentity(workload: string): WorkloadIdentityFiles {
  const directory = resolve(trustRoot, workload, 'current')
  return Object.freeze({
    ca: readFileSync(resolve(directory, 'ca.pem')),
    cert: readFileSync(resolve(directory, 'cert.pem')),
    key: readFileSync(resolve(directory, 'key.pem'))
  })
}

/** Binds the real grpc-js listener with mandatory client-certificate verification. */
function bindServer(server: Server, identity: WorkloadIdentityFiles): Promise<number> {
  return new Promise((resolvePort, reject) => {
    server.bindAsync(
      '127.0.0.1:0',
      ServerCredentials.createSsl(
        identity.ca,
        [{ cert_chain: identity.cert, private_key: identity.key }],
        true
      ),
      (error, port) => (error ? reject(error) : resolvePort(port))
    )
  })
}

/** Creates a client channel bound to one workload's real local leaf certificate. */
function createClientCredentials(identity: WorkloadIdentityFiles): ChannelCredentials {
  return credentials.createSsl(identity.ca, identity.key, identity.cert)
}

/** Invokes one unary exchange and preserves the real gRPC rejection message for assertions. */
function exchangeToken(
  client: ExecutionTokenClient,
  request: ExchangeRequest
): Promise<ExchangeResponse> {
  return new Promise((resolveResponse, reject) => {
    client.exchangeExecutionToken(request, (error, response) => {
      if (error) reject(error)
      else if (!response) reject(new Error('execution token response is unavailable'))
      else resolveResponse(response)
    })
  })
}

/** Maps a fail-closed Auth rejection onto a deterministic unary gRPC error. */
function toGrpcError(error: unknown): Error & { code: number } {
  const mapped = new Error(
    error instanceof Error ? error.message : 'execution token exchange failed'
  ) as Error & {
    code: number
  }
  mapped.code = status.PERMISSION_DENIED
  return mapped
}

/** Decodes the issued JWT payload so transport-binding claims can be asserted literally. */
function decodeClaims(accessToken: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'))
}
