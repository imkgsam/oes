import { execFileSync } from 'node:child_process'
import { createHash, generateKeyPairSync, sign } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'node:net'
import { Metadata } from '@grpc/grpc-js'
import {
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  INestApplication,
  INestMicroservice,
  Injectable,
  Module,
  Req,
  UseFilters
} from '@nestjs/common'
import { APP_GUARD, NestFactory, Reflector } from '@nestjs/core'
import {
  ClientGrpc,
  ClientProxyFactory,
  GrpcMethod,
  MicroserviceOptions,
  Transport
} from '@nestjs/microservices'
import { Test } from '@nestjs/testing'
import {
  admitTenantTargetSelector,
  AsyncLocalTrustedExecutionContextAccessor,
  CertificateBoundExecutionTokenCache,
  createSystemTenantTargetMethodDeclaration,
  ExecutionTokenExchangeClient,
  ExecutionTokenExchangeRequest,
  ExecutionTokenExchangeResult,
  ExecutionTokenJwksCache,
  ExecutionTokenVerifier,
  GatewayPermissionGuard,
  GRPC_METADATA_PROPAGATION_FACTORY,
  RequirePermissions,
  TENANT_ORG_MANAGEMENT_PERMISSION_CODES,
  TrustedExecutionRegistry,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { SERVICE_NAMES } from '@oes/common/constants'
import { AppLogger } from '@oes/common/logging'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  createGrpcServerCredentials,
  createGrpcClientCredentials,
  getGrpcClientToken,
  GrpcJsVerifiedPeerAdapter,
  readLocalVerifiedWorkloadIdentity
} from '@oes/common/transport'
import request from 'supertest'
import { firstValueFrom, Observable } from 'rxjs'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../../infrastructure/grpc/trusted-auth.grpc.client'
import {
  TENANTORG_TARGET_AUDIENCE,
  TrustedTenantOrgGrpcClient
} from '../../../infrastructure/grpc/trusted-tenant-org.grpc.client'
import { TenantTargetBindingGuard, VerifiedTenantTarget } from '../../../common/tenant-target'
import { GatewayExceptionFilter } from '../../../common/filters/gateway-exception.filter'
import { TenantOrgQueryGrpcAdapter } from './tenant-org-query-grpc.adapter'

const LOOPBACK = '127.0.0.1'
const GLOBAL_PREFIX = 'platform/v2'
const ISSUER = 'https://issuer.local.oes.internal'
const GATEWAY_SPIFFE = 'spiffe://local.oes.internal/ns/oes/sa/api-gateway'
const CODE = TENANT_ORG_MANAGEMENT_PERMISSION_CODES.LIST_ORG_TREE
const KID = 'matrix-es256-1'
const TRACEPARENT = '00-11111111111111111111111111111111-2222222222222222-01'
const REPOSITORY_ROOT = resolve(__dirname, '../../../../../../..')
const signingKeys = generateKeyPairSync('ec', { namedCurve: 'P-256' })
const publicJwk = signingKeys.publicKey.export({ format: 'jwk' })

type MatrixScope = 'SYSTEM' | 'TENANT'
type MatrixRequest = {
  matrixSource?: Record<string, unknown>
  user?: Record<string, unknown>
}

const matrix = {
  auditAllowed: true,
  permissionAllowed: true,
  scope: 'SYSTEM' as MatrixScope,
  subjectTenantId: 'Tenant-A:01',
  gatewayThumbprint: '',
  stsRequests: [] as Array<Record<string, unknown>>,
  stsMetadata: [] as Array<Record<string, unknown>>,
  permissionRequests: [] as Array<Record<string, unknown>>,
  permissionErrors: [] as unknown[],
  tenantSelectors: [] as string[],
  tenantTokens: [] as Array<Record<string, unknown>>,
  tenantBusinessCalls: 0
}

/** MatrixSessionGuard installs already-verified session facts without introducing path-target authority. */
@Injectable()
class MatrixSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<MatrixRequest>()
    const user = {
      aid: 'account-1',
      holderId: 'account-1',
      id: 'account-1',
      sub: 'user-1',
      scopeLevel: matrix.scope,
      ...(matrix.scope === 'TENANT' ? { tenantId: matrix.subjectTenantId } : {}),
      sid: 'session-1',
      terminal: 'WEB',
      authzVersion: 'authz-1'
    }
    request.user = user
    request.matrixSource = {
      requestId: 'matrix-request-1',
      traceparent: TRACEPARENT,
      user
    }
    return true
  }
}

/** MatrixGatewayController exercises the real Gateway guard/decorator/adapter chain. */
@Controller('tenant-management/tenants/:tenantId')
class MatrixGatewayController {
  constructor(private readonly adapter: TenantOrgQueryGrpcAdapter) {}

  @Get('org-tree')
  @RequirePermissions({ all: [CODE] })
  async getOrgTree(
    @VerifiedTenantTarget() tenantId: VerifiedTenantTarget,
    @Req() requestValue: MatrixRequest
  ) {
    return this.adapter.getOrgTreeByTenantId(tenantId, requestValue.matrixSource as never)
  }
}

/** MatrixAuthController is a real mTLS STS endpoint that signs exact ExecutionTokens. */
@Controller()
class MatrixAuthController {
  @GrpcMethod('ExecutionTokenService', 'ExchangeExecutionToken')
  exchangeExecutionToken(input: Record<string, unknown>, metadata: Metadata) {
    matrix.stsRequests.push(structuredClone(input))
    matrix.stsMetadata.push(metadata.getMap() as Record<string, unknown>)
    const now = Math.floor(Date.now() / 1000)
    const requestedPermissionCodes = [...((input.requestedPermissionCodes as string[]) ?? [])]
    const claims = {
      iss: ISSUER,
      aud: input.targetAudience,
      sub: 'account-1',
      principal_type: 'HUMAN',
      client_id: GATEWAY_SPIFFE,
      ...(matrix.scope === 'TENANT' ? { tenant_id: matrix.subjectTenantId } : {}),
      scope: requestedPermissionCodes.join(' '),
      jti: `matrix-token-${matrix.stsRequests.length}`,
      iat: now - 1,
      nbf: now - 1,
      exp: now + 240,
      cnf: { 'x5t#S256': matrix.gatewayThumbprint },
      session_id: 'session-1',
      session_terminal: 'WEB',
      authz_version: 'authz-1'
    }
    return {
      accessToken: createExecutionToken(claims),
      tokenType: 'Bearer',
      expiresAtUnixSeconds: String(now + 240),
      expiresInSeconds: '240',
      kid: KID,
      grantedPermissionCodes: requestedPermissionCodes,
      grantedAudience: input.targetAudience
    }
  }
}

/** MatrixPermissionController returns an explicit real-transport Permission decision. */
@Controller()
class MatrixPermissionController {
  @GrpcMethod('PermissionCheckService', 'CheckPermission')
  checkPermission(input: Record<string, unknown>) {
    matrix.permissionRequests.push(structuredClone(input))
    return { allowed: matrix.permissionAllowed }
  }
}

/** MatrixTenantOrgController verifies mTLS, ES256 token, Code and target-owned admission. */
@Controller()
@UseFilters(GrpcExceptionFilter)
class MatrixTenantOrgController {
  @GrpcMethod('TenantOrgQueryService', 'GetOrgTreeByTenantId')
  async getOrgTreeByTenantId(
    input: Record<string, unknown>,
    metadata: Metadata,
    call: { getAuthContext?: () => unknown }
  ) {
    const peer = await new GrpcJsVerifiedPeerAdapter().resolveVerifiedPeer(call as never)
    if (!peer) throw new Error('mTLS peer evidence missing')
    const workload = {
      spiffeId: peer.spiffeId,
      certificateThumbprint: createHash('sha256').update(peer.certificateDer).digest('base64url')
    }
    const authorization = metadata.get('authorization')[0]
    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
      throw new Error('ExecutionToken bearer missing')
    }
    const verified = await createExecutionTokenVerifier().verify({
      token: authorization.slice('Bearer '.length),
      targetAudience: TENANTORG_TARGET_AUDIENCE,
      workloadIdentity: workload
    })
    const selector = input.tenantId
    await admitTenantTargetSelector({
      verifiedExecutionToken: verified,
      verifiedWorkloadIdentity: workload,
      declaration: createSystemTenantTargetMethodDeclaration({
        selectorField: 'tenantId',
        gatewayWorkloadIdentity: GATEWAY_SPIFFE,
        permissionCode: CODE
      }),
      selector,
      bindAudit: async () => matrix.auditAllowed
    })
    matrix.tenantSelectors.push(String(selector))
    matrix.tenantTokens.push(verified as unknown as Record<string, unknown>)
    matrix.tenantBusinessCalls += 1
    return { roots: [] }
  }
}

@Module({ controllers: [MatrixAuthController] })
class MatrixAuthModule {}
@Module({ controllers: [MatrixPermissionController] })
class MatrixPermissionModule {}
@Module({
  controllers: [MatrixTenantOrgController],
  providers: [
    GrpcExceptionFilter,
    {
      provide: AppLogger,
      useValue: { error: () => undefined, warn: () => undefined }
    }
  ]
})
class MatrixTenantOrgModule {}

/** MatrixExecutionTokenExchangeClient uses the real mTLS wire contract without accepting target data. */
class MatrixExecutionTokenExchangeClient implements ExecutionTokenExchangeClient {
  private readonly client: ClientGrpc
  private readonly service: {
    exchangeExecutionToken(
      input: Record<string, unknown>,
      metadata: Metadata
    ): Observable<Record<string, unknown>>
  }

  constructor(port: number) {
    this.client = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'auth_service',
        protoPath: resolveCommonProtoPath('auth_service/execution_token.proto'),
        url: `localhost:${port}`,
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    this.service = this.client.getService('ExecutionTokenService')
  }

  async exchange(
    requestValue: ExecutionTokenExchangeRequest,
    metadata: Metadata
  ): Promise<ExecutionTokenExchangeResult> {
    const response = await firstValueFrom(
      this.service.exchangeExecutionToken(
        {
          targetAudience: requestValue.targetAudience,
          requestedPermissionCodes: [...requestValue.requestedPermissionCodes]
        },
        metadata
      )
    )
    return {
      accessToken: String(response.accessToken ?? ''),
      tokenType: String(response.tokenType ?? ''),
      expiresAtUnixSeconds: Number(response.expiresAtUnixSeconds),
      expiresInSeconds: Number(response.expiresInSeconds),
      kid: String(response.kid ?? ''),
      grantedPermissionCodes: Object.freeze([
        ...((response.grantedPermissionCodes as string[]) ?? [])
      ]),
      grantedAudience: String(response.grantedAudience ?? '')
    }
  }

  close(): void {
    ;(this.client as unknown as { close?: () => void }).close?.()
  }
}

/** createExecutionToken emits one strict ES256 at+jwt fixture from Auth's server boundary. */
function createExecutionToken(claims: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', typ: 'at+jwt', kid: KID })).toString(
    'base64url'
  )
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  const signingInput = `${header}.${payload}`
  const signature = sign('sha256', Buffer.from(signingInput), {
    key: signingKeys.privateKey,
    dsaEncoding: 'ieee-p1363'
  }).toString('base64url')
  return `${signingInput}.${signature}`
}

/** createExecutionTokenVerifier builds the real Common verifier over Auth's configured public key. */
function createExecutionTokenVerifier(): ExecutionTokenVerifier {
  return new ExecutionTokenVerifier({
    registry: new TrustedExecutionRegistry({
      issuer: ISSUER,
      audiences: [TENANTORG_TARGET_AUDIENCE],
      workloadIdentities: [GATEWAY_SPIFFE]
    }),
    jwksCache: new ExecutionTokenJwksCache({
      load: async () => ({ keys: [{ ...publicJwk, kid: KID, alg: 'ES256', use: 'sig' }] }),
      maxAgeMs: 300_000
    })
  })
}

/** issueServerCertificate creates a local-only test leaf with localhost and exact SPIFFE SANs. */
function issueServerCertificate(workspace: string, workload: string) {
  const directory = join(workspace, `matrix-${workload}`)
  mkdirSync(directory, { recursive: true })
  const keyPath = join(directory, 'key.pem')
  const requestPath = join(directory, 'request.pem')
  const certPath = join(directory, 'cert.pem')
  const extensionPath = join(directory, 'leaf-ext.cnf')
  writeFileSync(
    extensionPath,
    [
      'basicConstraints=critical,CA:FALSE',
      'keyUsage=critical,digitalSignature,keyEncipherment',
      'extendedKeyUsage=critical,clientAuth,serverAuth',
      `subjectAltName=critical,URI:spiffe://local.oes.internal/ns/oes/sa/${workload},DNS:localhost,IP:127.0.0.1`
    ].join('\n')
  )
  execFileSync('openssl', [
    'req',
    '-new',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-keyout',
    keyPath,
    '-out',
    requestPath,
    '-subj',
    `/CN=${workload}`
  ])
  execFileSync('openssl', [
    'x509',
    '-req',
    '-in',
    requestPath,
    '-CA',
    join(workspace, 'ca.pem'),
    '-CAkey',
    join(workspace, 'ca-key.pem'),
    '-CAserial',
    join(workspace, 'matrix-ca.srl'),
    '-CAcreateserial',
    '-out',
    certPath,
    '-days',
    '1',
    '-sha256',
    '-extfile',
    extensionPath
  ])
  return {
    OES_GRPC_TLS_ENABLED: 'true',
    OES_GRPC_TLS_MIN_VERSION: 'TLSv1.2',
    OES_GRPC_TLS_CA_PATH: join(workspace, 'ca.pem'),
    OES_GRPC_TLS_CERT_PATH: certPath,
    OES_GRPC_TLS_KEY_PATH: keyPath,
    OES_WORKLOAD_SPIFFE_ID: `spiffe://local.oes.internal/ns/oes/sa/${workload}`
  }
}

/** startGrpcServer starts one real mTLS Nest gRPC boundary on a kernel-selected port. */
async function startGrpcServer(
  moduleType: new (...args: never[]) => unknown,
  packageName: string,
  protoPath: string,
  tlsEnvironment: NodeJS.ProcessEnv
): Promise<{ port: number; server: INestMicroservice }> {
  const port = await reserveLoopbackPort()
  const server = await NestFactory.createMicroservice<MicroserviceOptions>(moduleType, {
    transport: Transport.GRPC,
    options: {
      package: packageName,
      protoPath,
      url: `${LOOPBACK}:${port}`,
      credentials: createGrpcServerCredentials(tlsEnvironment)
    }
  })
  await server.listen()
  return { port, server }
}

/** reserveLoopbackPort asks the kernel for one currently free local test endpoint. */
async function reserveLoopbackPort(): Promise<number> {
  const socket = createServer()
  await new Promise<void>((resolveListen, rejectListen) => {
    socket.once('error', rejectListen)
    socket.listen(0, LOOPBACK, resolveListen)
  })
  const address = socket.address()
  if (!address || typeof address === 'string') throw new Error('loopback port allocation failed')
  await new Promise<void>((resolveClose, rejectClose) =>
    socket.close((error) => (error ? rejectClose(error) : resolveClose()))
  )
  return address.port
}

/** resetObserved clears per-case evidence without replacing the real token cache. */
function resetObserved(): void {
  matrix.stsRequests = []
  matrix.stsMetadata = []
  matrix.permissionRequests = []
  matrix.permissionErrors = []
  matrix.tenantSelectors = []
  matrix.tenantTokens = []
  matrix.tenantBusinessCalls = 0
  matrix.auditAllowed = true
  matrix.permissionAllowed = true
  matrix.scope = 'SYSTEM'
  matrix.subjectTenantId = 'Tenant-A:01'
}

/** The matrix proves the exact target never enters STS, token, or cache authority. */
describe('Gateway tenant target real mTLS + ExecutionToken + Permission + Tenant Org matrix', () => {
  let app: INestApplication
  let workspace = ''
  let authServer: INestMicroservice
  let permissionServer: INestMicroservice
  let tenantOrgServer: INestMicroservice
  let tenantOrgClient: TrustedTenantOrgGrpcClient
  let permissionClient: ClientGrpc
  let exchangeClient: MatrixExecutionTokenExchangeClient
  const originalEnvironment = { ...process.env }

  beforeAll(async () => {
    workspace = mkdtempSync(join(tmpdir(), 'oes-gateway-target-matrix-'))
    execFileSync(
      'bash',
      [
        resolve(REPOSITORY_ROOT, 'docker/grpc-trust/bootstrap-local-trust.sh'),
        '--output',
        workspace
      ],
      {
        env: { ...process.env, OES_TRUST_ENV: 'local' }
      }
    )
    const authTls = issueServerCertificate(workspace, 'auth-service')
    const permissionTls = issueServerCertificate(workspace, 'permission-service')
    const tenantOrgTls = issueServerCertificate(workspace, 'tenant-org-service')
    const auth = await startGrpcServer(
      MatrixAuthModule,
      'auth_service',
      resolveCommonProtoPath('auth_service/execution_token.proto'),
      authTls
    )
    authServer = auth.server
    const permission = await startGrpcServer(
      MatrixPermissionModule,
      'permission_service',
      resolveCommonProtoPath('permission_service/permission_check.proto'),
      permissionTls
    )
    permissionServer = permission.server
    const tenantOrg = await startGrpcServer(
      MatrixTenantOrgModule,
      'tenant_org_service',
      resolveCommonProtoPath('tenant_org_service/tenant_org.proto'),
      tenantOrgTls
    )
    tenantOrgServer = tenantOrg.server

    const gatewayDirectory = join(workspace, 'api-gateway', 'current')
    Object.assign(process.env, {
      OES_GRPC_TLS_ENABLED: 'true',
      OES_GRPC_TLS_MIN_VERSION: 'TLSv1.2',
      OES_GRPC_TLS_CA_PATH: join(gatewayDirectory, 'ca.pem'),
      OES_GRPC_TLS_CERT_PATH: join(gatewayDirectory, 'cert.pem'),
      OES_GRPC_TLS_KEY_PATH: join(gatewayDirectory, 'key.pem'),
      OES_WORKLOAD_SPIFFE_ID: GATEWAY_SPIFFE,
      GRPC_SERVICE_PERMISSION_URL: `localhost:${permission.port}`,
      GRPC_SERVICE_TENANT_ORG_URL: `localhost:${tenantOrg.port}`
    })
    matrix.gatewayThumbprint = readLocalVerifiedWorkloadIdentity().certificateThumbprint

    const contextAccessor = new AsyncLocalTrustedExecutionContextAccessor()
    exchangeClient = new MatrixExecutionTokenExchangeClient(auth.port)
    const metadataProvider = new TrustedGrpcMetadataProvider({
      contextAccessor,
      registry: new TrustedExecutionRegistry({
        issuer: ISSUER,
        audiences: [TENANTORG_TARGET_AUDIENCE],
        workloadIdentities: [GATEWAY_SPIFFE]
      }),
      tokenCache: new CertificateBoundExecutionTokenCache({ refreshMarginSeconds: 30 }),
      exchangeClient,
      sourceCredentialAccessor: {
        useCurrent: <T>(consumer: (credential: string) => T) => consumer('matrix-source-token')
      } as never,
      localWorkloadIdentity: {
        getVerifiedWorkloadIdentity: async () => readLocalVerifiedWorkloadIdentity()
      }
    })
    const producer = new GatewayFoundationTrustedGrpcExecutionProducer(
      contextAccessor,
      metadataProvider,
      { getTraceContext: () => ({ traceparent: TRACEPARENT }) }
    )
    tenantOrgClient = new TrustedTenantOrgGrpcClient()
    const adapter = new TenantOrgQueryGrpcAdapter(tenantOrgClient, producer)
    adapter.onModuleInit()
    permissionClient = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'permission_service',
        protoPath: resolveCommonProtoPath('permission_service/permission_check.proto'),
        url: `localhost:${permission.port}`,
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    try {
      const permissionProbe = permissionClient.getService<{
        checkPermission(input: Record<string, unknown>, metadata: Metadata): Observable<unknown>
      }>('PermissionCheckService')
      await firstValueFrom(
        permissionProbe.checkPermission(
          { accountId: 'probe', permissionCode: CODE },
          new Metadata()
        )
      )
    } catch (error) {
      const grpcError = error as Error & { code?: number; details?: unknown }
      throw new Error(
        `Permission mTLS probe failed: ${JSON.stringify({
          message: grpcError.message,
          code: grpcError.code,
          details: grpcError.details
        })}`
      )
    }
    const gatewayModule = await Test.createTestingModule({
      controllers: [MatrixGatewayController],
      providers: [
        { provide: TenantOrgQueryGrpcAdapter, useValue: adapter },
        MatrixSessionGuard,
        TenantTargetBindingGuard,
        GatewayPermissionGuard,
        GatewayExceptionFilter,
        Reflector,
        { provide: getGrpcClientToken(SERVICE_NAMES.PERMISSION), useValue: permissionClient },
        {
          provide: GRPC_METADATA_PROPAGATION_FACTORY,
          useValue: { createInternalCallMetadata: () => new Metadata() }
        },
        {
          provide: AppLogger,
          useValue: {
            warn: (...args: unknown[]) => matrix.permissionErrors.push(args),
            error: (...args: unknown[]) => matrix.permissionErrors.push(args)
          }
        },
        { provide: APP_GUARD, useExisting: MatrixSessionGuard },
        { provide: APP_GUARD, useExisting: TenantTargetBindingGuard },
        { provide: APP_GUARD, useExisting: GatewayPermissionGuard }
      ]
    }).compile()
    app = gatewayModule.createNestApplication()
    app.setGlobalPrefix(GLOBAL_PREFIX)
    app.useGlobalFilters(app.get(GatewayExceptionFilter))
    await app.init()
  }, 60_000)

  afterAll(async () => {
    await app?.close()
    ;(permissionClient as unknown as { close?: () => void })?.close?.()
    ;(tenantOrgClient?.getClient() as unknown as { close?: () => void })?.close?.()
    exchangeClient?.close()
    await tenantOrgServer?.close()
    await permissionServer?.close()
    await authServer?.close()
    process.env = originalEnvironment
    if (workspace) rmSync(workspace, { force: true, recursive: true })
  })

  beforeEach(resetObserved)

  it('stops a Permission deny before STS exchange and Tenant Org admission', async () => {
    matrix.permissionAllowed = false

    await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/tenant-management/tenants/Tenant-A:01/org-tree`)
      .expect((response) => {
        if (response.status !== 403) {
          throw new Error(
            `expected Permission deny 403, got ${response.status}: ${JSON.stringify(matrix.permissionErrors)}`
          )
        }
      })

    expect(matrix.permissionRequests).toEqual([
      expect.objectContaining({ accountId: 'account-1', permissionCode: CODE })
    ])
    expect(matrix.stsRequests).toEqual([])
    expect(matrix.tenantSelectors).toEqual([])
    expect(matrix.tenantBusinessCalls).toBe(0)
  })

  it('reuses one tenantless SYSTEM token across two exact targets without target in STS or cache', async () => {
    await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/tenant-management/tenants/Tenant-A:01/org-tree`)
      .expect(200)
    await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/tenant-management/tenants/Tenant-B:02/org-tree`)
      .expect(200)

    expect(matrix.stsRequests).toEqual([
      {
        targetAudience: TENANTORG_TARGET_AUDIENCE,
        requestedPermissionCodes: [CODE]
      }
    ])
    expect(Object.keys(matrix.stsMetadata[0]).sort()).toEqual([
      'authorization',
      'traceparent',
      'user-agent',
      'x-request-id',
      'x-trace-id'
    ])
    expect(matrix.stsMetadata[0]).not.toHaveProperty('tenantId')
    expect(matrix.stsMetadata[0]).not.toHaveProperty('tenant_id')
    expect(matrix.tenantSelectors).toEqual(['Tenant-A:01', 'Tenant-B:02'])
    expect(matrix.tenantTokens).toHaveLength(2)
    matrix.tenantTokens.forEach((token) => expect(token).not.toHaveProperty('tenantId'))
    expect(matrix.tenantTokens[0].tokenId).toBe(matrix.tenantTokens[1].tokenId)
    expect(matrix.permissionRequests).toEqual([
      expect.not.objectContaining({ tenantId: expect.anything() }),
      expect.not.objectContaining({ tenantId: expect.anything() })
    ])
    expect(matrix.tenantBusinessCalls).toBe(2)
  })

  it('binds a TENANT subject token exactly to the same verified selector', async () => {
    matrix.scope = 'TENANT'
    matrix.subjectTenantId = 'Tenant-C:03'

    await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/tenant-management/tenants/Tenant-C:03/org-tree`)
      .expect(200)

    expect(matrix.stsRequests).toHaveLength(1)
    expect(matrix.stsRequests[0]).not.toHaveProperty('tenantId')
    expect(matrix.stsRequests[0]).not.toHaveProperty('tenant_id')
    expect(matrix.tenantTokens[0]).toMatchObject({ tenantId: 'Tenant-C:03' })
    expect(matrix.tenantSelectors).toEqual(['Tenant-C:03'])
    expect(matrix.permissionRequests[0]).toMatchObject({ tenantId: 'Tenant-C:03' })
  })

  it('stops after a target-owned admission audit denial without downstream business execution', async () => {
    matrix.auditAllowed = false

    const response = await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/tenant-management/tenants/Tenant-D:04/org-tree`)
      .expect(403)

    expect(response.body).toMatchObject({ code: 'APP_AUTH_002' })
    expect(matrix.permissionRequests).toHaveLength(1)
    expect(matrix.stsRequests).toEqual([])
    expect(matrix.tenantBusinessCalls).toBe(0)
    expect(matrix.tenantSelectors).toEqual([])
  })

  it('returns 400 for a malformed target before Permission, STS, or Tenant Org', async () => {
    await request(app.getHttpServer())
      .get(`/${GLOBAL_PREFIX}/tenant-management/tenants/%20Tenant-A:01%20/org-tree`)
      .expect(400)

    expect(matrix.permissionRequests).toEqual([])
    expect(matrix.stsRequests).toEqual([])
    expect(matrix.tenantSelectors).toEqual([])
    expect(matrix.tenantBusinessCalls).toBe(0)
  })
})
