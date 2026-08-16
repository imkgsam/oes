import { Metadata } from '@grpc/grpc-js'
import { Reflector } from '@nestjs/core'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  CertificateBoundExecutionTokenCache,
  CRM_INTERNAL_PERMISSION_CODES,
  CRM_MANAGEMENT_PERMISSION_CODES,
  ExecutionTokenJwksCache,
  ExecutionTokenVerifier,
  getAuthenticatedGrpcRequestContext,
  getRpcAuthorizationModeDeclaration,
  inboundExecutionTokenCredentialScope,
  TrustedExecutionRegistry,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import {
  AuthorizationPrincipalTypeProto,
  AuthorizationScopeLevelProto
} from '@oes/common/generated/permission_service'
import { generateKeyPairSync, sign } from 'node:crypto'
import { from, map } from 'rxjs'
import { CrmObjectReferenceGrpcController } from '../../src/interfaces/grpc/crm-object-reference.grpc.controller'
import { CustomerManagementGrpcController } from '../../src/interfaces/grpc/customer-management.grpc.controller'
import { CustomerQueryGrpcController } from '../../src/interfaces/grpc/customer-query.grpc.controller'
import { CustomerRpcContextValidator } from '../../src/interfaces/grpc/customer-rpc-context.validator'
import {
  CRM_AUDIENCE,
  CrmTrustedBusinessExecutionGuard,
  CrmTrustedInternalExecutionGuard
} from '../../src/modules/crm-trusted-execution.module'
import { ExecutionTokenExchangeService } from '../../../../system/auth-service/src/application/services/execution-token-exchange.service'
import { ExecutionTokenRegistry as AuthExecutionTokenRegistry } from '../../../../system/auth-service/src/domain/services/execution-token-registry'
import { ExecutionTokenSubjectCredentialVerifier } from '../../../../system/auth-service/src/infrastructure/execution-token-signer/execution-token-subject-credential.verifier'
import { VerifiedExecutionTokenContextProvider } from '../../../../system/auth-service/src/infrastructure/execution-token-signer/verified-execution-token-context.provider'
import {
  CompositeSourceCredentialVerifier,
  PermissionDecisionGrpcResolver
} from '../../../../system/auth-service/src/modules/token/execution-token.module'
import { CollaborationFoundationTrustedGrpcExecutionProducer } from '../../../../system/collaboration-service/src/infrastructure/adapters/foundation-trusted-grpc.clients'
import { ResolveWorkloadIssuanceHandler } from '../../../../system/permission-service/src/application/queries/authorization/resolve-workload-issuance.handler'
import { ResolveWorkloadIssuanceQuery } from '../../../../system/permission-service/src/application/queries/authorization/resolve-workload-issuance.query'
import { PermissionDecisionPolicy } from '../../../../system/permission-service/src/domain/services/permission-decision-policy'

const queryCodes = {
  listCrmAccounts: CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT,
  getCrmAccount: CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT,
  listSourceRecords: CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT,
  checkLeadDuplicate: CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT
} as const
const managementCodes = {
  createDraftLead: CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT,
  updateDraftLead: CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT,
  submitDraftLead: CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT,
  deleteDraftLead: CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT,
  createLead: CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT,
  claimCrmAccount: CRM_MANAGEMENT_PERMISSION_CODES.CLAIM_CRM_ACCOUNT,
  releaseCrmAccount: CRM_MANAGEMENT_PERMISSION_CODES.RELEASE_CRM_ACCOUNT,
  archiveCrmAccount: CRM_MANAGEMENT_PERMISSION_CODES.MANAGE_CRM_ACCOUNT,
  updateCrmAccountIdentifiers: CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT,
  convertLeadToProspectCustomer: CRM_MANAGEMENT_PERMISSION_CODES.CONVERT_CRM_ACCOUNT
} as const
const dualTerminalMethods = new Set([
  'getCrmAccount',
  'checkLeadDuplicate',
  'createDraftLead',
  'createLead',
  'claimCrmAccount'
])
const thumbprint = 'A'.repeat(43)
const mainSource = readFileSync(join(__dirname, '../../src/main.ts'), 'utf8')

/** Locks all 15 CRM RPCs to the frozen Token-only Gateway/Collaboration matrix. */
describe('CRM trusted gRPC security matrix L3', () => {
  it('declares exact 14 BUSINESS plus one INTERNAL method with five dual-terminal methods', () => {
    const business = [
      ...Object.entries(queryCodes).map(
        ([method, code]) => [CustomerQueryGrpcController.prototype, method, code] as const
      ),
      ...Object.entries(managementCodes).map(
        ([method, code]) => [CustomerManagementGrpcController.prototype, method, code] as const
      )
    ]
    expect(business).toHaveLength(14)
    for (const [prototype, method, code] of business) {
      expect(getRpcAuthorizationModeDeclaration(prototype, method)).toEqual({
        mode: 'BUSINESS',
        permissions: { all: [code] },
        principalType: 'HUMAN',
        sessionTerminals: dualTerminalMethods.has(method) ? ['WEB', 'BROWSER_EXTENSION'] : ['WEB']
      })
    }
    expect(
      getRpcAuthorizationModeDeclaration(
        CrmObjectReferenceGrpcController.prototype,
        'validateCrmObjectReference'
      )
    ).toEqual({
      mode: 'INTERNAL',
      permissions: { all: [CRM_INTERNAL_PERMISSION_CODES.VALIDATE_OBJECT_REFERENCE] }
    })
  })

  it('installs exact guards/context validator and deployment mTLS on all controllers', () => {
    for (const controller of [CustomerQueryGrpcController, CustomerManagementGrpcController]) {
      expect(Reflect.getMetadata('__guards__', controller)).toEqual(
        expect.arrayContaining([CrmTrustedBusinessExecutionGuard, CustomerRpcContextValidator])
      )
    }
    expect(Reflect.getMetadata('__guards__', CrmObjectReferenceGrpcController)).toEqual(
      expect.arrayContaining([CrmTrustedInternalExecutionGuard, CustomerRpcContextValidator])
    )
    expect(mainSource).toContain('credentials: createGrpcServerCredentials()')
  })

  it('admits WEB and BROWSER_EXTENSION only on the exact five-method set', async () => {
    await expect(
      runBusiness(
        CustomerQueryGrpcController,
        CustomerQueryGrpcController.prototype.getCrmAccount,
        queryCodes.getCrmAccount,
        { sessionTerminal: 'BROWSER_EXTENSION' }
      )
    ).resolves.toBeDefined()
    await expect(
      runBusiness(
        CustomerQueryGrpcController,
        CustomerQueryGrpcController.prototype.listCrmAccounts,
        queryCodes.listCrmAccounts,
        { sessionTerminal: 'BROWSER_EXTENSION' }
      )
    ).rejects.toThrow()
  })

  it.each([
    ['MACHINE principal', { principalType: 'MACHINE' }],
    ['DELEGATED principal', { principalType: 'DELEGATED' }],
    ['PDA terminal', { sessionTerminal: 'PDA' }],
    ['missing terminal', { sessionTerminal: undefined }],
    ['missing session', { sessionId: undefined }],
    ['wrong audience', { audience: 'urn:oes:service:other-service' }],
    ['wrong cnf', { certificateThumbprint: 'B'.repeat(43) }],
    ['expired token', { expiresAt: 1 }],
    ['wrong workload', { clientId: 'spiffe://oes/collaboration-service' }],
    ['unexpected actor', { actor: collaborationActor() }],
    ['missing Code', { permissionCodes: [] }]
  ])('rejects BUSINESS %s', async (_label, overrides) => {
    await expect(
      runBusiness(
        CustomerQueryGrpcController,
        CustomerQueryGrpcController.prototype.listCrmAccounts,
        queryCodes.listCrmAccounts,
        overrides
      )
    ).rejects.toThrow()
  })

  it('admits exact Collaboration HUMAN_OBO and derives subject/tenant/trace context', async () => {
    const result = await runInternal()
    expect(new CustomerRpcContextValidator().canActivate(result.context)).toBe(true)
    expect(CustomerRpcContextValidator.assertQueryContext(result.body)).toMatchObject({
      tenantId: 'tenant-1',
      operatorContext: { operatorId: 'human-1' },
      traceContext: { requestId: 'request-1', traceId: 'trace-1' }
    })
  })

  it('composes verified Collaboration ingress through Identity, Permission, Auth OBO signing, and CRM admission', async () => {
    const now = 1_700_000_300
    const issuer = 'https://auth.local.oes.example'
    const collaborationAudience = 'urn:oes:service:collaboration-service'
    const gatewaySpiffe = 'spiffe://oes/api-gateway'
    const collaborationSpiffe = 'spiffe://oes/collaboration-service'
    const gatewayCert = 'G'.repeat(43)
    const collaborationCert = 'C'.repeat(43)
    const code = CRM_INTERNAL_PERMISSION_CODES.VALIDATE_OBJECT_REFERENCE
    const pair = generateKeyPairSync('ec', { namedCurve: 'P-256' })
    const publicJwk = pair.publicKey.export({ format: 'jwk' })
    const signingKey = {
      kid: 'auth-crm-obo-key',
      publicJwk,
      publishNotBeforeUnixSeconds: now - 600,
      signingNotBeforeUnixSeconds: now - 300,
      retireAfterUnixSeconds: now + 3_600
    }
    const signer = {
      currentSigningKey: async () => signingKey,
      publishedKeys: async () => [signingKey],
      sign: async (_kid: string, input: Uint8Array) =>
        sign('sha256', input, { key: pair.privateKey, dsaEncoding: 'ieee-p1363' })
    }
    const createVerifier = (audience: string, workload: string) =>
      new ExecutionTokenVerifier({
        registry: new TrustedExecutionRegistry({
          issuer,
          audiences: [audience],
          workloadIdentities: [workload]
        }),
        jwksCache: new ExecutionTokenJwksCache({
          load: async () => ({
            keys: [{ ...publicJwk, kid: signingKey.kid, alg: 'ES256', use: 'sig' }]
          }),
          maxAgeMs: 300_000,
          now: () => now * 1_000
        }),
        clockSkewSeconds: 0,
        now: () => now
      })
    const subjectHeader = Buffer.from(
      JSON.stringify({ alg: 'ES256', typ: 'at+jwt', kid: signingKey.kid })
    ).toString('base64url')
    const subjectClaims = Buffer.from(
      JSON.stringify({
        iss: issuer,
        aud: collaborationAudience,
        sub: 'human-1',
        principal_type: 'HUMAN',
        client_id: gatewaySpiffe,
        tenant_id: 'tenant-1',
        org_id: 'org-1',
        scope: 'collaboration.annotation.create',
        jti: 'collaboration-subject-jti',
        iat: now - 30,
        nbf: now - 30,
        exp: now + 180,
        cnf: { 'x5t#S256': gatewayCert },
        session_id: 'session-1',
        session_terminal: 'WEB',
        authz_version: 'subject-authz-1'
      })
    ).toString('base64url')
    const subjectSignature = sign('sha256', Buffer.from(`${subjectHeader}.${subjectClaims}`), {
      key: pair.privateKey,
      dsaEncoding: 'ieee-p1363'
    }).toString('base64url')
    const subjectToken = `${subjectHeader}.${subjectClaims}.${subjectSignature}`
    const inbound = await createVerifier(collaborationAudience, gatewaySpiffe).verify({
      token: subjectToken,
      targetAudience: collaborationAudience,
      workloadIdentity: { spiffeId: gatewaySpiffe, certificateThumbprint: gatewayCert }
    })

    const authRegistry = new AuthExecutionTokenRegistry({
      issuer,
      workloadPolicies: [
        {
          spiffeId: collaborationSpiffe,
          audiences: [CRM_AUDIENCE],
          humanObo: {
            selfAudience: collaborationAudience,
            actorMachinePrincipalId: 'machine-principal:collaboration-service',
            actorBindingId: 'binding:collaboration-service',
            actorBindingVersion: '7',
            targetAudiences: [CRM_AUDIENCE]
          }
        }
      ]
    })
    const identity = {
      resolveMachinePrincipalForAuth: jest.fn().mockResolvedValue({
        allowed: true,
        principalId: 'machine-principal:collaboration-service',
        principalType: 'MACHINE',
        principalLifecycleStatus: 'ACTIVE',
        bindingId: 'binding:collaboration-service',
        bindingVersion: BigInt(7),
        bindingStatus: 'ACTIVE',
        workloadSpiffeId: collaborationSpiffe,
        scopeLevel: 'SYSTEM'
      })
    }
    const workloadRepository = {
      findPolicy: jest.fn().mockResolvedValue({
        originalWorkloadSpiffeId: collaborationSpiffe,
        targetAudience: CRM_AUDIENCE,
        permissionCodes: [code],
        scopeLevel: 'SYSTEM',
        policyVersion: 'policy-v1'
      })
    }
    const permissionRepository = {
      findByCodes: jest.fn().mockResolvedValue([{ code, kind: 'INTERNAL' }])
    }
    const permissionAudit = { emitIssuanceDecision: jest.fn() }
    const permissionHandler = new ResolveWorkloadIssuanceHandler(
      workloadRepository as never,
      permissionRepository as never,
      new PermissionDecisionPolicy(),
      permissionAudit as never
    )
    const permissionDecision = jest.fn((permissionRequest) =>
      from(
        permissionHandler.execute(
          new ResolveWorkloadIssuanceQuery(
            {
              originalWorkloadSpiffeId: permissionRequest.originalWorkloadSpiffeId,
              targetAudience: permissionRequest.targetAudience,
              requestedPermissionCodes: permissionRequest.requestedInternalPermissionCodes,
              scopeLevel:
                permissionRequest.scopeLevel ===
                AuthorizationScopeLevelProto.AUTHORIZATION_SCOPE_LEVEL_PROTO_SYSTEM
                  ? 'SYSTEM'
                  : 'TENANT',
              ...(permissionRequest.tenantId ? { tenantId: permissionRequest.tenantId } : {}),
              ...(permissionRequest.orgId ? { orgId: permissionRequest.orgId } : {}),
              principalType:
                permissionRequest.principalType ===
                AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_MACHINE
                  ? 'MACHINE'
                  : 'HUMAN',
              principalId: permissionRequest.principalId,
              issuancePolicyVersion: permissionRequest.issuancePolicyVersion
            },
            {
              directWorkloadSpiffeId: 'spiffe://oes/auth-service',
              certificateThumbprint: 'A'.repeat(43)
            }
          )
        )
      ).pipe(
        map((result) => ({
          ...result,
          originalWorkloadSpiffeId: permissionRequest.originalWorkloadSpiffeId,
          targetAudience: permissionRequest.targetAudience,
          scopeLevel: permissionRequest.scopeLevel,
          tenantId: permissionRequest.tenantId ?? '',
          orgId: permissionRequest.orgId ?? '',
          principalType: permissionRequest.principalType,
          principalId: permissionRequest.principalId,
          requestedPermissionCodes: permissionRequest.requestedInternalPermissionCodes
        }))
      )
    )
    const audit = { appendOboLink: jest.fn().mockResolvedValue(undefined) }
    const exchange = new ExecutionTokenExchangeService(
      authRegistry,
      signer as never,
      () => now,
      audit
    )
    const permission = new PermissionDecisionGrpcResolver(
      { getService: () => ({ resolveWorkloadIssuance: permissionDecision }) } as never,
      exchange,
      { spiffeId: 'spiffe://oes/auth-service', certificateThumbprint: 'A'.repeat(43) },
      'policy-v1'
    )
    const provider = new VerifiedExecutionTokenContextProvider(
      {
        getVerifiedWorkloadIdentity: async () => ({
          spiffeId: collaborationSpiffe,
          certificateThumbprint: collaborationCert
        })
      },
      new CompositeSourceCredentialVerifier(
        {} as never,
        {} as never,
        new ExecutionTokenSubjectCredentialVerifier(
          signer as never,
          identity as never,
          authRegistry,
          () => now
        )
      ),
      permission
    )
    let exchangeFailure: unknown
    const producer = new CollaborationFoundationTrustedGrpcExecutionProducer(
      {
        exchange: async (targetRequest, metadata) => {
          try {
            const resolved = await provider.resolve({ metadata }, targetRequest)
            return exchange.exchange({ ...targetRequest, ...resolved })
          } catch (error) {
            exchangeFailure = error
            throw error
          }
        }
      },
      {
        getVerifiedWorkloadIdentity: async () => ({
          spiffeId: collaborationSpiffe,
          certificateThumbprint: collaborationCert
        })
      },
      () => now
    )
    const sourceRequest = {}
    const traceparent = '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'
    inboundExecutionTokenCredentialScope.prepare(sourceRequest, subjectToken, inbound, {
      requestId: 'request-1',
      traceparent
    })
    const previousIssuer = process.env.AUTH_EXECUTION_ISSUER
    const previousWorkload = process.env.OES_WORKLOAD_SPIFFE_ID
    process.env.AUTH_EXECUTION_ISSUER = issuer
    process.env.OES_WORKLOAD_SPIFFE_ID = collaborationSpiffe
    let outboundMetadata: Metadata
    try {
      try {
        outboundMetadata = await inboundExecutionTokenCredentialScope.runPrepared(
          sourceRequest,
          () => producer.forInternalCall('crm-service', code)
        )
      } catch (error) {
        throw exchangeFailure ?? error
      }
    } finally {
      restoreEnvironment('AUTH_EXECUTION_ISSUER', previousIssuer)
      restoreEnvironment('OES_WORKLOAD_SPIFFE_ID', previousWorkload)
    }

    const body: Record<string, unknown> = {
      objectType: 'CRM_ACCOUNT',
      objectId: 'crm-1',
      requestedCapability: 2
    }
    const targetContext = executionContext(
      CrmObjectReferenceGrpcController,
      CrmObjectReferenceGrpcController.prototype.validateCrmObjectReference,
      body,
      outboundMetadata,
      { spiffeId: collaborationSpiffe, certificateThumbprint: collaborationCert }
    )
    const targetGuard = new CrmTrustedInternalExecutionGuard(
      new Reflector(),
      createVerifier(CRM_AUDIENCE, collaborationSpiffe),
      {
        getVerifiedWorkloadIdentity: async () => ({
          spiffeId: collaborationSpiffe,
          certificateThumbprint: collaborationCert
        })
      } as never,
      CRM_AUDIENCE
    )
    await expect(targetGuard.canActivate(targetContext)).resolves.toBe(true)
    expect(new CustomerRpcContextValidator().canActivate(targetContext)).toBe(true)
    const verified = getAuthenticatedGrpcRequestContext(body)?.verifiedExecutionToken
    expect(verified).toMatchObject({
      audience: CRM_AUDIENCE,
      subject: 'human-1',
      principalType: 'HUMAN',
      clientId: collaborationSpiffe,
      tenantId: 'tenant-1',
      orgId: 'org-1',
      permissionCodes: [code],
      certificateThumbprint: collaborationCert,
      sessionId: 'session-1',
      sessionTerminal: 'WEB',
      actor: collaborationActor()
    })
    expect(verified?.expiresAt).toBeLessThanOrEqual(inbound.expiresAt)
    expect(outboundMetadata.get('x-request-id')).toEqual(['request-1'])
    expect(outboundMetadata.get('traceparent')).toEqual([traceparent])
    expect(identity.resolveMachinePrincipalForAuth).toHaveBeenCalledTimes(1)
    expect(permissionDecision).toHaveBeenCalledTimes(1)
    expect(audit.appendOboLink).toHaveBeenCalledWith(
      expect.objectContaining({ sourceTokenId: 'collaboration-subject-jti' })
    )
  })

  it.each([
    ['missing subject proof', { subject: '' }],
    ['wrong principal', { principalType: 'MACHINE' }],
    ['wrong actor', { actor: { ...collaborationActor(), sub: 'machine-principal:wms-service' } }],
    ['missing actor', { actor: undefined }],
    ['BROWSER_EXTENSION terminal', { sessionTerminal: 'BROWSER_EXTENSION' }],
    ['missing terminal', { sessionTerminal: undefined }],
    ['missing session', { sessionId: undefined }],
    ['wrong audience', { audience: 'urn:oes:service:other-service' }],
    ['wrong Code', { permissionCodes: ['crm.account.read'] }],
    ['expired token', { expiresAt: 1 }],
    ['wrong trace workload', { clientId: 'spiffe://oes/wms-service' }],
    ['wrong cnf', { certificateThumbprint: 'B'.repeat(43) }]
  ])('rejects INTERNAL HUMAN_OBO %s', async (_label, overrides) => {
    await expect(runInternal(overrides)).rejects.toThrow()
  })

  it('rejects missing credential/correlation and all retired body authority', async () => {
    await expect(runInternal({}, {}, false)).rejects.toThrow()
    await expect(runInternal({}, {}, true, false)).rejects.toThrow()
    for (const body of [
      { tenantId: 'attacker' },
      { operatorContext: {} },
      { traceContext: {} },
      { auditContext: {} },
      { claimForCurrentUser: true },
      { allowOwnerlessConversion: true }
    ]) {
      const result = await runBusiness(
        CustomerQueryGrpcController,
        CustomerQueryGrpcController.prototype.listCrmAccounts,
        queryCodes.listCrmAccounts,
        {},
        body
      )
      expect(() => new CustomerRpcContextValidator().canActivate(result.context)).toThrow()
    }
  })
})

/** Executes CRM's actual BUSINESS guard against one target-token fixture. */
async function runBusiness(
  controller: object,
  handler: unknown,
  code: string,
  overrides: Record<string, unknown> = {},
  body: Record<string, unknown> = {}
) {
  const verified = targetToken(code, overrides)
  const workloadIdentity = {
    spiffeId: verified.clientId as string,
    certificateThumbprint: thumbprint
  }
  const context = executionContext(controller, handler, body, baseMetadata(), workloadIdentity)
  await new CrmTrustedBusinessExecutionGuard(
    new Reflector(),
    strictVerifier(verified) as never,
    { getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue(workloadIdentity) } as never,
    CRM_AUDIENCE
  ).canActivate(context)
  return { context, body }
}

/** Executes CRM's INTERNAL guard with request-private HUMAN_OBO facts. */
async function runInternal(
  overrides: Record<string, unknown> = {},
  body: Record<string, unknown> = {},
  includeBearer = true,
  includeCorrelation = true
) {
  const verified = targetToken(CRM_INTERNAL_PERMISSION_CODES.VALIDATE_OBJECT_REFERENCE, {
    clientId: 'spiffe://oes/collaboration-service',
    actor: collaborationActor(),
    ...overrides
  })
  const workloadIdentity = {
    spiffeId: verified.clientId as string,
    certificateThumbprint: thumbprint
  }
  const metadata = baseMetadata(includeBearer, includeCorrelation)
  const context = executionContext(
    CrmObjectReferenceGrpcController,
    CrmObjectReferenceGrpcController.prototype.validateCrmObjectReference,
    body,
    metadata,
    workloadIdentity
  )
  await new CrmTrustedInternalExecutionGuard(
    new Reflector(),
    strictVerifier(verified) as never,
    { getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue(workloadIdentity) } as never,
    CRM_AUDIENCE
  ).canActivate(context)
  return { context, body }
}

/** Creates one audience/certificate/session-bound HUMAN token fixture. */
function targetToken(code: string, overrides: Record<string, unknown>) {
  return {
    issuer: 'https://auth.example',
    audience: CRM_AUDIENCE,
    subject: 'human-1',
    principalType: 'HUMAN',
    clientId: 'spiffe://oes/api-gateway',
    tenantId: 'tenant-1',
    orgId: 'org-1',
    permissionCodes: [code],
    tokenId: 'token-1',
    issuedAt: 1,
    notBefore: 1,
    expiresAt: 9999999999,
    certificateThumbprint: thumbprint,
    sessionId: 'session-1',
    sessionTerminal: 'WEB',
    ...overrides
  }
}

/** Mimics local issuer/audience/workload/cnf/time/session/tenant verification. */
function strictVerifier(verified: ReturnType<typeof targetToken>) {
  return {
    verify: jest.fn(async (input) => {
      if (
        verified.audience !== input.targetAudience ||
        verified.certificateThumbprint !== input.workloadIdentity.certificateThumbprint ||
        verified.clientId !== input.workloadIdentity.spiffeId ||
        !verified.subject ||
        !verified.sessionId ||
        !verified.sessionTerminal ||
        !verified.tenantId ||
        verified.tenantId === '*' ||
        verified.tenantId === 'SYSTEM' ||
        Number(verified.expiresAt) <= Math.floor(Date.now() / 1000)
      ) {
        throw new Error('invalid CRM target token')
      }
      return verified
    })
  }
}

/** Returns Auth's exact Collaboration SYSTEM MACHINE actor. */
function collaborationActor() {
  return {
    sub: 'machine-principal:collaboration-service',
    principal_type: 'MACHINE',
    scope_level: 'SYSTEM'
  }
}

/** Builds ordinary correlation metadata with optional credential/correlation gaps. */
function baseMetadata(includeBearer = true, includeCorrelation = true): Metadata {
  const metadata = new Metadata()
  if (includeBearer) metadata.set('authorization', 'Bearer target.execution.token')
  if (includeCorrelation) {
    metadata.set('x-request-id', 'request-1')
    metadata.set('x-trace-id', 'trace-1')
    metadata.set('traceparent', '00-11111111111111111111111111111111-2222222222222222-01')
  }
  return metadata
}

/** Creates the Nest RPC context consumed by Common and CRM guards. */
function executionContext(
  controller: object,
  handler: unknown,
  body: object,
  metadata: Metadata,
  workloadIdentity: { spiffeId: string; certificateThumbprint: string }
) {
  return {
    switchToRpc: () => ({ getData: () => body, getContext: () => metadata }),
    getHandler: () => handler,
    getClass: () => controller,
    getArgByIndex: () => ({ workloadIdentity })
  } as never
}

/** Restores one process environment entry after an exact-runtime composition fixture. */
function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name]
    return
  }
  process.env[name] = value
}
