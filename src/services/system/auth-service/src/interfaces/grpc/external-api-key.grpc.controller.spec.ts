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
  RequireAuthenticatedOperator: () => () => undefined,
  RequirePermissions: () => () => undefined,
  TrustedInternalExecutionGuard: class TrustedInternalExecutionGuard {}
}))

import { ExternalApiKeyGrpcController } from './external-api-key.grpc.controller'

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
    const controller = new ExternalApiKeyGrpcController(service)
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
    const controller = new ExternalApiKeyGrpcController(service)
    const list = await controller.listExternalApiKeys({ integrationMachineId: 'm', ...trustedHumanRequest }, undefined, trustedHumanRequest as any)
    const revoke = await controller.revokeExternalApiKey({ credentialId: 'c', ...trustedHumanRequest }, undefined, trustedHumanRequest as any)
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
    const controller = new ExternalApiKeyGrpcController(service)
    const response = await controller.rotateExternalApiKey(
      { credentialId: 'predecessor', ...trustedHumanRequest },
      undefined,
      trustedHumanRequest as any
    )
    expect(service.rotate).toHaveBeenCalledWith('predecessor')
    expect(response).toEqual({
      apiKey: 'oek_live_new.secret',
      credential: expect.objectContaining({ credentialId: 'replacement', integrationMachineId: 'm' }),
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
    const controller = new ExternalApiKeyGrpcController(service)
    const response = await controller.exchangeExternalApiKey(
      { presentedApiKey: 'oek_live_id.secret', ...trustedGatewayRequest },
      undefined,
      trustedGatewayRequest as any
    )
    expect(service.exchangeExternalApiKey).toHaveBeenCalledWith('oek_live_id.secret')
    expect(response).toEqual({ accessToken: 'signed', tokenType: 'Bearer', expiresInSeconds: '300' })
  })
})
