jest.mock('@oes/common/authorization', () => ({
  getAuthenticatedGrpcRequestContext: jest.fn((rpcData: any) => rpcData?.__context),
  AuthenticatedOperatorGuard: class AuthenticatedOperatorGuard {},
  AuthorizeInternalCall: () => () => undefined,
  GrpcRequestContextInterceptor: class GrpcRequestContextInterceptor {},
  IDENTITY_MACHINE_PERMISSION_CODES: {
    CREATE_API_KEY: 'identity.machine.api_key.create',
    ROTATE_API_KEY: 'identity.machine.api_key.rotate',
    REVOKE_API_KEY: 'identity.machine.api_key.revoke'
  },
  InternalServiceGuard: class InternalServiceGuard {},
  PermissionGuard: class PermissionGuard {},
  RequirePermissions: () => () => undefined,
  TrustedInternalExecutionGuard: class TrustedInternalExecutionGuard {}
}))

import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ExternalApiKeyGrpcController } from './external-api-key.grpc.controller'
import { CompromiseExternalApiKeyVerifierVersionCommand } from '../../application/commands/auth'

const trustedHumanRequest = {
  __context: {
    operatorContext: { operator_type: 'HUMAN', tenant_id: 'tenant-1', operator_id: 'operator-1' }
  }
}

const trustedGatewayRequest = {
  __context: {
    verifiedExecutionToken: {
      audience: 'urn:oes:service:auth-service',
      principalType: 'MACHINE',
      subject: 'api-gateway',
      clientId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
      permissionCodes: ['auth.internal.external_api_key.exchange']
    },
    verifiedWorkloadIdentity: {
      spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway'
    }
  }
}

const trustedCompromiseRequest = {
  __context: {
    verifiedExecutionToken: {
      audience: 'urn:oes:service:auth-service',
      principalType: 'MACHINE',
      subject: 'security-operations-runner',
      clientId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner',
      permissionCodes: ['auth.internal.external_api_key.verifier_version.compromise']
    },
    verifiedWorkloadIdentity: {
      spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner'
    },
    requestId: 'req-compromise',
    traceId: 'trace-compromise'
  }
}

describe('ExternalApiKeyGrpcController', () => {

  it('maps create to the service and returns only one-time key plus safe id', async () => {
    const service: any = {
      create: jest.fn().mockResolvedValue({
        credentialId: 'c',
        apiKey: 'oek_live_id.secret',
        credential: {
          id: 'c',
          integrationMachineId: 'm',
          keyIdentifier: 'masked',
          status: 'ACTIVE',
          createdAt: new Date('2026-08-01T00:00:00.000Z'),
          expiresAt: new Date('2027-08-01T00:00:00.000Z')
        }
      })
    }
    const controller = new ExternalApiKeyGrpcController(service, { execute: jest.fn() } as any)
    const result = await controller.createExternalApiKey(
      { integrationMachineId: 'm', ...trustedHumanRequest },
      undefined,
      trustedHumanRequest as any
    )
    expect(service.create).toHaveBeenCalledWith({ integrationMachineId: 'm' })
    expect(result).toEqual({
      apiKey: 'oek_live_id.secret',
      credential: expect.objectContaining({
        credentialId: 'c',
        integrationMachineId: 'm',
        keyIdentifier: 'masked',
        status: 'ACTIVE'
      })
    })
    expect(JSON.stringify(result)).not.toMatch(/verifier|pepper|trust/i)
  })

  it('maps masked list and safe idempotent revoke responses', async () => {
    const service: any = {
      list: jest.fn().mockResolvedValue([
        {
          id: 'c',
          keyIdentifier: 'masked',
          integrationMachineId: 'm',
          status: 'ACTIVE',
          createdAt: new Date('2026-08-01T00:00:00.000Z'),
          expiresAt: new Date('2027-08-01T00:00:00.000Z')
        }
      ]),
      revoke: jest.fn().mockResolvedValue(undefined)
    }
    const controller = new ExternalApiKeyGrpcController(service, { execute: jest.fn() } as any)
    const list = await controller.listExternalApiKeys(
      { integrationMachineId: 'm', ...trustedHumanRequest },
      undefined,
      trustedHumanRequest as any
    )
    const revoke = await controller.revokeExternalApiKey(
      { credentialId: 'c', ...trustedHumanRequest },
      undefined,
      trustedHumanRequest as any
    )
    expect(list).toEqual({
      credentials: [
        expect.objectContaining({
          credentialId: 'c',
          keyIdentifier: 'masked',
          integrationMachineId: 'm',
          status: 'ACTIVE'
        })
      ]
    })
    expect(revoke).toEqual({ credential: { credentialId: 'c', status: 'REVOKED' } })
    expect(JSON.stringify({ list, revoke })).not.toMatch(/secret|verifier|pepper|token/i)
  })

  it('maps rotate with credentialId only and safe predecessor metadata', async () => {
    const until = new Date('2026-08-08T00:00:00.000Z')
    const service: any = {
      rotate: jest.fn().mockResolvedValue({
        credentialId: 'replacement',
        apiKey: 'oek_live_new.secret',
        predecessorValidUntil: until,
        credential: {
          id: 'replacement',
          integrationMachineId: 'm',
          keyIdentifier: 'masked-new',
          status: 'ACTIVE',
          createdAt: new Date('2026-08-01T00:00:00.000Z'),
          expiresAt: new Date('2027-08-01T00:00:00.000Z')
        }
      })
    }
    const controller = new ExternalApiKeyGrpcController(service, { execute: jest.fn() } as any)
    const response = await controller.rotateExternalApiKey(
      { credentialId: 'predecessor', ...trustedHumanRequest },
      undefined,
      trustedHumanRequest as any
    )
    expect(service.rotate).toHaveBeenCalledWith('predecessor')
    expect(response).toEqual({
      apiKey: 'oek_live_new.secret',
      credential: expect.objectContaining({
        credentialId: 'replacement',
        integrationMachineId: 'm'
      }),
      predecessorCredentialId: 'predecessor',
      predecessorValidUntilUnixSeconds: String(Math.floor(until.getTime() / 1000))
    })
    expect(JSON.stringify(response)).not.toMatch(/verifier|pepper|token/i)
  })

  it('permits the Gateway-only exchange path with signed MACHINE runtime context', async () => {
    const service: any = {
      exchangeExternalApiKey: jest.fn().mockResolvedValue({
        accessToken: 'signed',
        tokenType: 'Bearer',
        expiresInSeconds: '300'
      })
    }
    const controller = new ExternalApiKeyGrpcController(service, { execute: jest.fn() } as any)
    const response = await controller.exchangeExternalApiKey(
      { presentedApiKey: 'oek_live_id.secret', ...trustedGatewayRequest },
      undefined,
      trustedGatewayRequest as any
    )
    expect(service.exchangeExternalApiKey).toHaveBeenCalledWith('oek_live_id.secret')
    expect(response).toEqual({ accessToken: 'signed', tokenType: 'Bearer', expiresInSeconds: '300' })
  })

  it('maps the compromise RPC to the command bus using only trusted runtime workload facts', async () => {
    const service: any = {}
    const commandBus = {
      execute: jest.fn().mockResolvedValue({
        incidentReference: 'INC-1',
        matchedCredentialCount: 4,
        newlyRevokedCredentialCount: 3,
        alreadyRevokedCredentialCount: 1,
        completedAt: new Date('2026-08-02T04:00:00.000Z')
      })
    } as unknown as ValidatingCommandBus & { execute: jest.Mock }
    const controller = new ExternalApiKeyGrpcController(service, commandBus)

    const response = await controller.compromiseExternalApiKeyVerifierVersion(
      {
        verifierKeyVersion: 'verifier-v1',
        incidentReference: 'INC-1',
        occurredAtUnixSeconds: '1785643200',
        workloadSubject: 'forged-subject',
        workloadClientId: 'forged-client',
        ...trustedCompromiseRequest
      },
      undefined,
      trustedCompromiseRequest as any
    )

    expect(commandBus.execute).toHaveBeenCalledTimes(1)
    const command = commandBus.execute.mock.calls[0][0]
    expect(command).toBeInstanceOf(CompromiseExternalApiKeyVerifierVersionCommand)
    expect(command).toEqual(
      new CompromiseExternalApiKeyVerifierVersionCommand({
        verifierKeyVersion: 'verifier-v1',
        incidentReference: 'INC-1',
        occurredAtUnixSeconds: 1785643200,
        workloadSubject: 'security-operations-runner',
        workloadClientId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner',
        requestId: 'req-compromise',
        traceId: 'trace-compromise'
      })
    )
    expect(response).toEqual({
      incidentReference: 'INC-1',
      matchedCredentialCount: 4,
      newlyRevokedCredentialCount: 3,
      alreadyRevokedCredentialCount: 1,
      completedAtUnixSeconds: 1785643200
    })
    expect(JSON.stringify(response)).not.toMatch(/secret|verifier|token|workload/i)
  })

  it('denies compromise calls from any non-registered runtime context before command execution', async () => {
    const commandBus = { execute: jest.fn() } as any
    const controller = new ExternalApiKeyGrpcController({} as any, commandBus)

    await expect(
      controller.compromiseExternalApiKeyVerifierVersion(
        {
          verifierKeyVersion: 'verifier-v1',
          incidentReference: 'INC-1',
          occurredAtUnixSeconds: '1785643200',
          __context: {
            verifiedExecutionToken: {
              audience: 'urn:oes:service:auth-service',
              principalType: 'MACHINE',
              subject: 'security-operations-runner',
              clientId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner',
              permissionCodes: [
                'auth.internal.external_api_key.verifier_version.compromise',
                'auth.internal.external_api_key.exchange'
              ]
            },
            verifiedWorkloadIdentity: {
              spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner'
            }
          }
        },
        undefined,
        undefined
      )
    ).rejects.toThrow('EXTERNAL_API_KEY_VERIFIER_COMPROMISE_DENIED')
    expect(commandBus.execute).not.toHaveBeenCalled()
  })
})
