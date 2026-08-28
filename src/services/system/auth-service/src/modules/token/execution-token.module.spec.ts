import { MODULE_METADATA } from '@nestjs/common/constants'
import { of } from 'rxjs'
import {
  AuthorizationPrincipalTypeProto,
  AuthorizationScopeLevelProto
} from '@oes/common/generated/permission_service'
import { AuthPermissionTrustedGrpcClient } from '../../infrastructure/adaptors/foundation-trusted-grpc.clients'
import { EXECUTION_TOKEN_EXCHANGE_CONTEXT } from '../../application/ports/execution-token-exchange-context.port'
import { ExecutionTokenRegistry } from '../../domain/services/execution-token-registry'
import {
  EXECUTION_TOKEN_PERMISSION_DECISION_RESOLVER,
  EXECUTION_TOKEN_SOURCE_CREDENTIAL_VERIFIER,
  AuthSessionSourceCredentialVerifier,
  ExecutionTokenModule,
  PermissionDecisionGrpcResolver
} from './execution-token.module'

type ProviderDefinition = Readonly<{
  provide?: unknown
  inject?: readonly unknown[]
}>

/** Proves the STS context is wired to Auth credential truth and the authority-bound Permission client. */
describe('ExecutionTokenModule authority wiring', () => {
  it('injects separate source verification and Permission decision dependencies into the exchange boundary', () => {
    const providers: Array<ProviderDefinition | Function> = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      ExecutionTokenModule
    )
    const contextProvider = providers.find(
      (provider) =>
        typeof provider === 'object' && provider?.provide === EXECUTION_TOKEN_EXCHANGE_CONTEXT
    ) as ProviderDefinition
    const sourceProvider = providers.find(
      (provider) =>
        typeof provider === 'object' &&
        provider?.provide === EXECUTION_TOKEN_SOURCE_CREDENTIAL_VERIFIER
    )
    const decisionProvider = providers.find(
      (provider) =>
        typeof provider === 'object' &&
        provider?.provide === EXECUTION_TOKEN_PERMISSION_DECISION_RESOLVER
    ) as ProviderDefinition

    expect(sourceProvider).toBeDefined()
    expect((sourceProvider as ProviderDefinition).inject).toEqual(
      expect.arrayContaining([ExecutionTokenRegistry])
    )
    expect(decisionProvider.inject).toEqual(
      expect.arrayContaining([AuthPermissionTrustedGrpcClient])
    )
    expect(contextProvider.inject).toEqual(
      expect.arrayContaining([
        EXECUTION_TOKEN_SOURCE_CREDENTIAL_VERIFIER,
        EXECUTION_TOKEN_PERMISSION_DECISION_RESOLVER
      ])
    )
  })

  it('builds HUMAN execution facts from Auth active-session validation without copying roles or Codes', async () => {
    const execute = jest.fn().mockResolvedValue({
      accountId: 'account-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      sessionId: 'session-1',
      terminal: 'WEB',
      scopeLevel: 'TENANT',
      roles: ['legacy-role'],
      permissions: ['requested.code']
    })
    const verifier = new AuthSessionSourceCredentialVerifier({ execute } as any)

    const result = await verifier.verify(
      'verified.session.access-token',
      {
        spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
        certificateThumbprint: 'A'.repeat(43)
      },
      {
        requestId: 'request-session-source',
        traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01'
      }
    )

    expect(execute.mock.calls[0][0]).toEqual(
      expect.objectContaining({ accessToken: 'verified.session.access-token' })
    )
    expect(result).toEqual({
      subject: 'account-1',
      principalType: 'HUMAN',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      sessionId: 'session-1',
      sessionTerminal: 'WEB'
    })
    expect(result).not.toHaveProperty('permissionCodes')
  })

  it.each(['UNKNOWN', 'web', ' WEB', 'WEB '] as const)(
    'rejects non-canonical active-session terminal %s before signing context is created',
    async (terminal) => {
      const verifier = new AuthSessionSourceCredentialVerifier({
        execute: jest.fn().mockResolvedValue({
          accountId: 'account-1',
          scopeLevel: 'TENANT',
          sessionId: 'session-1',
          terminal
        })
      } as any)

      await expect(
        verifier.verify(
          'verified.session.access-token',
          {
            spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
            certificateThumbprint: 'A'.repeat(43)
          },
          {
            requestId: 'request-session-source',
            traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01'
          }
        )
      ).rejects.toThrow('session terminal')
    }
  )

  it('preserves a partial current workload decision so the signing gate can reject it', async () => {
    const resolveWorkloadIssuance = jest.fn().mockReturnValue(
      of({
        allowed: false,
        grantedPermissionCodes: ['asset.internal.read'],
        deniedPermissionCodes: ['asset.internal.write'],
        originalWorkloadSpiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
        targetAudience: 'urn:oes:service:asset-service',
        scopeLevel: AuthorizationScopeLevelProto.AUTHORIZATION_SCOPE_LEVEL_PROTO_TENANT,
        tenantId: 'tenant-1',
        principalType: AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_HUMAN,
        principalId: 'account-1',
        requestedPermissionCodes: ['asset.internal.read', 'asset.internal.write'],
        decisionReference: 'workload-decision-1',
        authzVersion: 'authz-1'
      })
    )
    const resolver = new PermissionDecisionGrpcResolver(
      { getService: () => ({ resolveWorkloadIssuance }) } as any,
      { exchange: jest.fn() } as any,
      {
        spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/auth-service',
        certificateThumbprint: 'B'.repeat(43)
      },
      'policy-v1'
    )

    const result = await resolver.resolve({
      request: {
        targetAudience: 'urn:oes:service:asset-service',
        requestedPermissionCodes: ['asset.internal.read', 'asset.internal.write']
      },
      workloadIdentity: {
        spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
        certificateThumbprint: 'A'.repeat(43)
      },
      execution: {
        subject: 'account-1',
        principalType: 'HUMAN',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        sessionId: 'session-1'
      }
    })

    expect(result.allowed).toBe(false)
    expect(result.grantedPermissionCodes).toEqual(['asset.internal.read'])
    expect(result.deniedPermissionCodes).toEqual(['asset.internal.write'])
    expect(resolveWorkloadIssuance).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedInternalPermissionCodes: ['asset.internal.read', 'asset.internal.write']
      }),
      expect.anything()
    )
  })

  it('uses the protected principal decision output after an independently granted bootstrap Token', async () => {
    const resolveWorkloadIssuance = jest.fn().mockReturnValue(
      of({
        allowed: true,
        grantedPermissionCodes: ['permission.internal.principal_authorization.resolve'],
        deniedPermissionCodes: [],
        originalWorkloadSpiffeId: 'spiffe://local.oes.internal/ns/oes/sa/auth-service',
        targetAudience: 'urn:oes:service:permission-service',
        scopeLevel: AuthorizationScopeLevelProto.AUTHORIZATION_SCOPE_LEVEL_PROTO_TENANT,
        tenantId: 'tenant-1',
        principalType: AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_HUMAN,
        principalId: 'account-1',
        requestedPermissionCodes: ['permission.internal.principal_authorization.resolve'],
        decisionReference: 'bootstrap-decision-1',
        authzVersion: 'bootstrap-authz-1'
      })
    )
    const resolvePrincipalAuthorization = jest.fn().mockReturnValue(
      of({
        allowed: false,
        grantedPermissionCodes: ['AUTH.READ'],
        deniedPermissionCodes: ['AUTH.WRITE'],
        principalType: AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_HUMAN,
        principalId: 'account-1',
        scopeLevel: AuthorizationScopeLevelProto.AUTHORIZATION_SCOPE_LEVEL_PROTO_TENANT,
        tenantId: 'tenant-1',
        targetAudience: 'urn:oes:service:asset-service',
        requestedPermissionCodes: ['AUTH.READ', 'AUTH.WRITE'],
        decisionReference: 'principal-decision-1',
        authzVersion: 'principal-authz-1'
      })
    )
    const exchange = jest.fn().mockResolvedValue({ accessToken: 'permission.execution.token' })
    const resolver = new PermissionDecisionGrpcResolver(
      {
        getService: () => ({ resolveWorkloadIssuance, resolvePrincipalAuthorization })
      } as any,
      { exchange } as any,
      {
        spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/auth-service',
        certificateThumbprint: 'B'.repeat(43)
      },
      'policy-v1'
    )

    const result = await resolver.resolve({
      request: {
        targetAudience: 'urn:oes:service:asset-service',
        requestedPermissionCodes: ['AUTH.READ', 'AUTH.WRITE']
      },
      workloadIdentity: {
        spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
        certificateThumbprint: 'A'.repeat(43)
      },
      execution: {
        subject: 'account-1',
        principalType: 'HUMAN',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        sessionId: 'session-1'
      }
    })

    expect(exchange).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedPermissionCodes: ['permission.internal.principal_authorization.resolve'],
        authorizationDecision: expect.objectContaining({
          grantedPermissionCodes: ['permission.internal.principal_authorization.resolve']
        })
      })
    )
    expect(resolvePrincipalAuthorization.mock.calls[0][1].get('authorization')).toEqual([
      'Bearer permission.execution.token'
    ])
    expect(result).toEqual(
      expect.objectContaining({
        allowed: false,
        grantedPermissionCodes: ['AUTH.READ'],
        deniedPermissionCodes: ['AUTH.WRITE'],
        authzVersion: 'principal-authz-1'
      })
    )
  })
})
