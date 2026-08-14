import {
  ExecutionTokenJwksCache,
  ExecutionTokenVerifier,
  AsyncLocalTrustedExecutionContextAccessor,
  CertificateBoundExecutionTokenCache,
  TrustedExecutionRegistry,
  TrustedGrpcMetadataProvider,
  createTrustedExecutionContext,
  getRpcAuthorizationModeDeclaration,
  inboundExecutionTokenCredentialScope
} from '@oes/common/authorization'
import { Metadata } from '@grpc/grpc-js'
import { Reflector } from '@nestjs/core'
import { generateKeyPairSync, sign } from 'node:crypto'
import { from, map } from 'rxjs'
import {
  AuthorizationPrincipalTypeProto,
  AuthorizationScopeLevelProto
} from '@oes/common/generated/permission_service'
import {
  ITEM_MASTER_INTERNAL_PERMISSION_CODES,
  ITEM_MASTER_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import { ItemMasterInternalQueryGrpcController } from '../../src/interfaces/grpc/item-master-internal-query.grpc.controller'
import { ItemMasterManagementGrpcController } from '../../src/interfaces/grpc/item-master-management.grpc.controller'
import { ItemMasterQueryGrpcController } from '../../src/interfaces/grpc/item-master-query.grpc.controller'
import {
  ITEM_MASTER_INTERNAL_WORKLOAD_ALLOWLIST,
  ItemMasterTrustedInternalExecutionGuard
} from '../../src/modules/item-master-trusted-execution.module'
import { ItemMasterVerifiedTenantContextGuard } from '../../src/interfaces/grpc/item-master-rpc-context.guard'
import { ExecutionTokenRegistry as AuthExecutionTokenRegistry } from '../../../auth-service/src/domain/services/execution-token-registry'
import { ExecutionTokenSubjectCredentialVerifier } from '../../../auth-service/src/infrastructure/execution-token-signer/execution-token-subject-credential.verifier'
import { VerifiedExecutionTokenContextProvider } from '../../../auth-service/src/infrastructure/execution-token-signer/verified-execution-token-context.provider'
import { ExecutionTokenExchangeService } from '../../../auth-service/src/application/services/execution-token-exchange.service'
import {
  CompositeSourceCredentialVerifier,
  PermissionDecisionGrpcResolver
} from '../../../auth-service/src/modules/token/execution-token.module'
import { ResolveWorkloadIssuanceHandler } from '../../../permission-service/src/application/queries/authorization/resolve-workload-issuance.handler'
import { ResolveWorkloadIssuanceQuery } from '../../../permission-service/src/application/queries/authorization/resolve-workload-issuance.query'
import { PermissionDecisionPolicy } from '../../../permission-service/src/domain/services/permission-decision-policy'

const queryCodes = {
  getItemModel: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_MODEL_DETAIL,
  batchGetItemModels: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_MODEL,
  searchItemModels: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_MODEL,
  listAttributeDefinitions: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
  listAttributeOptions: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
  getItemModelAttributeRules: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
  getItem: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_DETAIL,
  batchGetItems: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM,
  searchItems: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM,
  resolveItemVariant: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_DETAIL,
  listItemCategories: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_CATEGORIES,
  listPackagingMethods: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
  getPackagingSpec: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
  searchPackagingSpecs: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
  getBom: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
  searchBoms: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
  getBomByOutputItem: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
  listSupplierItemMappingsByItem:
    ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_ITEM_MAPPINGS,
  resolveSupplierItemMapping: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_ITEM_MAPPINGS
} as const

const managementCodes = {
  createItemModel: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM_MODEL,
  updateItemModelBasics: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ITEM_MODEL,
  setItemModelCapabilities: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ITEM_MODEL,
  changeItemModelStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ITEM_MODEL,
  setItemModelPrimaryCategory: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.SET_ITEM_PRIMARY_CATEGORY,
  createAttributeDefinition: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ATTRIBUTE,
  updateAttributeDefinition: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ATTRIBUTE,
  createAttributeOption: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ATTRIBUTE,
  updateAttributeOption: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ATTRIBUTE,
  setItemModelAttributeRules: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ATTRIBUTE,
  createItem: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM,
  updateItemBasics: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_BASICS,
  setItemCapabilities: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.SET_ITEM_CAPABILITIES,
  changeItemStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_STATUS,
  createItemCategory: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM_CATEGORY,
  updateItemCategoryBasics: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_CATEGORY_BASICS,
  moveItemCategory: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_CATEGORY_BASICS,
  changeItemCategoryStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_CATEGORY_STATUS,
  deleteItemCategory: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.DELETE_ITEM_CATEGORY,
  createPackagingMethod: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_PACKAGING,
  updatePackagingMethod: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
  changePackagingMethodStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
  deletePackagingMethod: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
  createPackagingSpec: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_PACKAGING,
  updatePackagingSpec: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
  changePackagingSpecStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
  createBom: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_BOM,
  updateBomBasics: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_BOM,
  replaceBomLines: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_BOM,
  changeBomStatus: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_BOM,
  upsertSupplierItemMapping: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_ITEM_MAPPING
} as const

const internalCodes = {
  resolveManufacturableItem: ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_MANUFACTURABLE_ITEM,
  resolveStockableItem: ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_STOCKABLE_ITEM,
  resolvePurchasableItem: ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_PURCHASABLE_ITEM
} as const

/** Locks all 53 Item Master RPCs to their frozen authorization modes and exact codes. */
describe('Item Master trusted gRPC security matrix L3', () => {
  it('declares all 50 HUMAN/WEB RPCs with one exact BUSINESS code', () => {
    const entries = [
      ...Object.entries(queryCodes).map(
        (entry) => [ItemMasterQueryGrpcController.prototype, ...entry] as const
      ),
      ...Object.entries(managementCodes).map(
        (entry) => [ItemMasterManagementGrpcController.prototype, ...entry] as const
      )
    ]
    expect(entries).toHaveLength(50)
    for (const [prototype, method, code] of entries) {
      expect(getRpcAuthorizationModeDeclaration(prototype, method)).toEqual({
        mode: 'BUSINESS',
        permissions: { all: [code] },
        principalType: 'HUMAN',
        sessionTerminal: 'WEB'
      })
    }
  })

  it('declares the three workload-only RPCs with exact INTERNAL allowlists', () => {
    expect(Object.keys(internalCodes)).toHaveLength(3)
    for (const [method, code] of Object.entries(internalCodes)) {
      expect(
        getRpcAuthorizationModeDeclaration(ItemMasterInternalQueryGrpcController.prototype, method)
      ).toEqual({
        mode: 'INTERNAL',
        permissions: { all: [code] }
      })
    }
    expect(ITEM_MASTER_INTERNAL_WORKLOAD_ALLOWLIST).toEqual({
      [ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_MANUFACTURABLE_ITEM]: ['mes-service'],
      [ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_STOCKABLE_ITEM]: ['wms-service'],
      [ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_PURCHASABLE_ITEM]: [
        'procurement-service',
        'srm-service'
      ]
    })
  })

  /** Executes the actual Item Master guard stack against one verifier-produced target ET shape. */
  async function runInternalGuard(
    method: keyof typeof internalCodes,
    overrides: Record<string, unknown> = {},
    body: Record<string, unknown> = { itemId: 'item-1' }
  ) {
    const metadata = new Metadata()
    metadata.set('authorization', 'Bearer target.execution.token')
    const verified = {
      issuer: 'https://auth.example',
      audience: 'urn:oes:service:item-master-service',
      subject: 'account-1',
      principalType: 'HUMAN',
      clientId: 'spiffe://oes/mes-service',
      tenantId: 'tenant-1',
      permissionCodes: [internalCodes[method]],
      tokenId: 'target-jti',
      issuedAt: 100,
      notBefore: 100,
      expiresAt: 300,
      certificateThumbprint: 'A'.repeat(43),
      sessionId: 'session-1',
      sessionTerminal: 'WEB',
      actor: {
        sub: 'machine-principal:mes-service',
        principal_type: 'MACHINE',
        scope_level: 'SYSTEM'
      },
      ...overrides
    }
    const verifier = { verify: jest.fn().mockResolvedValue(verified) }
    const workload = {
      getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue({
        spiffeId: verified.clientId,
        certificateThumbprint: verified.certificateThumbprint
      })
    }
    const handler = ItemMasterInternalQueryGrpcController.prototype[method]
    const context = {
      switchToRpc: () => ({ getData: () => body, getContext: () => metadata }),
      getHandler: () => handler,
      getClass: () => ItemMasterInternalQueryGrpcController,
      getArgByIndex: () => ({})
    } as never
    const guard = new ItemMasterTrustedInternalExecutionGuard(
      new Reflector(),
      verifier as never,
      workload as never,
      'urn:oes:service:item-master-service'
    )
    await guard.canActivate(context)
    return { context, body, verifier }
  }

  it('admits HUMAN OBO with the exact actor/workload/Code and derives tenant from claims', async () => {
    const body = { itemId: 'item-1', tenantId: 'attacker-tenant', actor: 'attacker' }
    const result = await runInternalGuard('resolveManufacturableItem', {}, body)
    expect(new ItemMasterVerifiedTenantContextGuard().canActivate(result.context)).toBe(true)
    expect(body.tenantId).toBe('tenant-1')
    expect(result.verifier.verify).toHaveBeenCalledWith(
      expect.objectContaining({ targetAudience: 'urn:oes:service:item-master-service' })
    )
  })

  it.each([
    ['direct HUMAN without actor', { actor: undefined }],
    ['MACHINE root', { principalType: 'MACHINE', actor: undefined }],
    [
      'nested actor chain',
      {
        actor: {
          sub: 'machine-principal:mes-service',
          principal_type: 'MACHINE',
          scope_level: 'SYSTEM',
          act: {}
        }
      }
    ],
    [
      'TENANT actor',
      {
        actor: {
          sub: 'machine-principal:mes-service',
          principal_type: 'MACHINE',
          scope_level: 'TENANT'
        }
      }
    ],
    [
      'blank actor subject',
      { actor: { sub: '', principal_type: 'MACHINE', scope_level: 'SYSTEM' } }
    ],
    ['blank tenant', { tenantId: '' }],
    ['wrong workload for Code', { clientId: 'spiffe://oes/wms-service' }],
    ['malformed workload identity', { clientId: 'mes-service' }]
  ])('rejects %s before controller execution', async (_label, overrides) => {
    await expect(runInternalGuard('resolveManufacturableItem', overrides)).rejects.toThrow()
  })

  it('composes verified MES inbound scope through Identity, Permission, Auth signing, and Item Master admission', async () => {
    const now = 1_700_000_300
    const issuer = 'https://auth.local.oes.example'
    const mesAudience = 'urn:oes:service:mes-service'
    const itemAudience = 'urn:oes:service:item-master-service'
    const gatewaySpiffe = 'spiffe://oes/api-gateway'
    const mesSpiffe = 'spiffe://oes/mes-service'
    const gatewayCert = 'G'.repeat(43)
    const mesCert = 'M'.repeat(43)
    const pair = generateKeyPairSync('ec', { namedCurve: 'P-256' })
    const publicJwk = pair.publicKey.export({ format: 'jwk' })
    const signingKey = {
      kid: 'auth-obo-key',
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
        aud: mesAudience,
        sub: 'account-1',
        principal_type: 'HUMAN',
        client_id: gatewaySpiffe,
        tenant_id: 'tenant-1',
        scope: 'mes.production_spec.manage',
        jti: 'mes-subject-jti',
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
    const inbound = await createVerifier(mesAudience, gatewaySpiffe).verify({
      token: subjectToken,
      targetAudience: mesAudience,
      workloadIdentity: { spiffeId: gatewaySpiffe, certificateThumbprint: gatewayCert }
    })

    const authRegistry = new AuthExecutionTokenRegistry({
      issuer,
      workloadPolicies: [
        {
          spiffeId: mesSpiffe,
          audiences: [itemAudience],
          humanObo: {
            selfAudience: mesAudience,
            actorMachinePrincipalId: 'machine-principal:mes-service',
            actorBindingId: 'binding:mes-service',
            actorBindingVersion: '7',
            targetAudiences: [itemAudience]
          }
        }
      ]
    })
    const identity = {
      resolveMachinePrincipalForAuth: jest.fn().mockResolvedValue({
        allowed: true,
        principalId: 'machine-principal:mes-service',
        principalType: 'MACHINE',
        principalLifecycleStatus: 'ACTIVE',
        bindingId: 'binding:mes-service',
        bindingVersion: BigInt(7),
        bindingStatus: 'ACTIVE',
        workloadSpiffeId: mesSpiffe,
        scopeLevel: 'SYSTEM'
      })
    }
    const workloadRepository = {
      findPolicy: jest.fn().mockResolvedValue({
        originalWorkloadSpiffeId: mesSpiffe,
        targetAudience: itemAudience,
        permissionCodes: [internalCodes.resolveManufacturableItem],
        scopeLevel: 'SYSTEM',
        policyVersion: 'policy-v1'
      })
    }
    const permissionRepository = {
      findByCodes: jest
        .fn()
        .mockResolvedValue([{ code: internalCodes.resolveManufacturableItem, kind: 'INTERNAL' }])
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
          spiffeId: mesSpiffe,
          certificateThumbprint: mesCert
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
    const request = {}
    inboundExecutionTokenCredentialScope.prepare(request, subjectToken, inbound)
    const outboundMetadata = await inboundExecutionTokenCredentialScope.runPrepared(request, () =>
      inboundExecutionTokenCredentialScope.run(async () => {
        const contextAccessor = new AsyncLocalTrustedExecutionContextAccessor()
        const metadataProvider = new TrustedGrpcMetadataProvider({
          contextAccessor,
          registry: new TrustedExecutionRegistry({
            issuer,
            audiences: [itemAudience],
            workloadIdentities: [mesSpiffe]
          }),
          tokenCache: new CertificateBoundExecutionTokenCache({
            now: () => now,
            refreshMarginSeconds: 15
          }),
          exchangeClient: {
            exchange: async (targetRequest, metadata) => {
              const resolved = await provider.resolve({ metadata }, targetRequest)
              return exchange.exchange({ ...targetRequest, ...resolved })
            }
          },
          sourceCredentialAccessor: inboundExecutionTokenCredentialScope.accessor,
          localWorkloadIdentity: {
            getVerifiedWorkloadIdentity: async () => ({
              spiffeId: mesSpiffe,
              certificateThumbprint: mesCert
            })
          },
          now: () => now
        })
        const root = createTrustedExecutionContext({
          subject: inbound.subject,
          principalType: 'HUMAN',
          tenantId: inbound.tenantId,
          sessionId: inbound.sessionId,
          sessionTerminal: inbound.sessionTerminal,
          requestId: 'request-1',
          traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'
        })
        return contextAccessor.run(root, () =>
          metadataProvider.forInternalCall(itemAudience, [internalCodes.resolveManufacturableItem])
        )
      })
    )

    const body: Record<string, unknown> = { itemId: 'item-1', tenantId: 'body-tenant' }
    const context = {
      switchToRpc: () => ({ getData: () => body, getContext: () => outboundMetadata }),
      getHandler: () => ItemMasterInternalQueryGrpcController.prototype.resolveManufacturableItem,
      getClass: () => ItemMasterInternalQueryGrpcController,
      getArgByIndex: () => ({})
    } as never
    const targetVerifier = createVerifier(itemAudience, mesSpiffe)
    const guard = new ItemMasterTrustedInternalExecutionGuard(
      new Reflector(),
      targetVerifier,
      {
        getVerifiedWorkloadIdentity: async () => ({
          spiffeId: mesSpiffe,
          certificateThumbprint: mesCert
        })
      } as never,
      itemAudience
    )
    await expect(guard.canActivate(context)).resolves.toBe(true)
    expect(new ItemMasterVerifiedTenantContextGuard().canActivate(context)).toBe(true)
    expect(body.tenantId).toBe('tenant-1')
    expect(identity.resolveMachinePrincipalForAuth).toHaveBeenCalledTimes(1)
    expect(permissionDecision).toHaveBeenCalledTimes(1)
    expect(permissionDecision.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        originalWorkloadSpiffeId: mesSpiffe,
        targetAudience: itemAudience,
        requestedInternalPermissionCodes: [internalCodes.resolveManufacturableItem],
        scopeLevel: AuthorizationScopeLevelProto.AUTHORIZATION_SCOPE_LEVEL_PROTO_SYSTEM,
        principalType: AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_MACHINE,
        principalId: 'machine-principal:mes-service',
        tenantId: undefined,
        orgId: undefined
      })
    )
    expect(workloadRepository.findPolicy).toHaveBeenCalledWith({
      originalWorkloadSpiffeId: mesSpiffe,
      targetAudience: itemAudience,
      scopeLevel: 'SYSTEM',
      tenantId: undefined
    })
    expect(permissionAudit.emitIssuanceDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        principalType: 'MACHINE',
        principalId: 'machine-principal:mes-service',
        tenantId: undefined
      })
    )
    const tenantVariant = await permission.resolve({
      request: {
        targetAudience: itemAudience,
        requestedPermissionCodes: [internalCodes.resolveManufacturableItem]
      },
      workloadIdentity: { spiffeId: mesSpiffe, certificateThumbprint: mesCert },
      execution: {
        subject: 'account-other',
        principalType: 'HUMAN',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-other',
        sessionId: 'session-other',
        actor: {
          sub: 'machine-principal:mes-service',
          principal_type: 'MACHINE',
          scope_level: 'SYSTEM'
        },
        sourceTokenId: 'other-subject-jti',
        sourceExpiresAt: now + 120
      }
    })
    expect(tenantVariant).toMatchObject({
      allowed: true,
      principalType: 'HUMAN',
      principalId: 'account-other',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-other'
    })
    expect(permissionDecision).toHaveBeenCalledTimes(2)
    expect(permissionDecision.mock.calls[1][0]).toEqual(permissionDecision.mock.calls[0][0])
    expect(workloadRepository.findPolicy).toHaveBeenNthCalledWith(2, {
      originalWorkloadSpiffeId: mesSpiffe,
      targetAudience: itemAudience,
      scopeLevel: 'SYSTEM',
      tenantId: undefined
    })
    expect(audit.appendOboLink).toHaveBeenCalledWith(
      expect.objectContaining({ sourceTokenId: 'mes-subject-jti' })
    )
    expect(() => inboundExecutionTokenCredentialScope.requireVerifiedExecution()).toThrow(
      'required'
    )
  })
})
