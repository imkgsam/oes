import { of } from 'rxjs'
import { Metadata } from '@grpc/grpc-js'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  createTrustedExecutionContext
} from '@oes/common/authorization'
import { GatewayAuthExecutionTokenExchangeClient } from './gateway-auth-execution-token-exchange.client'

/** Verifies Gateway's concrete STS client sends only frozen exchange fields and correlation metadata. */
describe('GatewayAuthExecutionTokenExchangeClient', () => {
  it('maps the exact Auth STS response without legacy identity headers', async () => {
    const exchangeExecutionToken = jest.fn((_request: unknown, _metadata: Metadata) =>
      of({
        accessToken: 'a.b.c',
        tokenType: 'Bearer',
        expiresAtUnixSeconds: '2000',
        expiresInSeconds: '300',
        kid: 'kid-1',
        grantedPermissionCodes: ['hr.employee.create'],
        grantedAudience: 'urn:oes:service:asset-service'
      })
    )
    const contextAccessor = new AsyncLocalTrustedExecutionContextAccessor()
    const client = new GatewayAuthExecutionTokenExchangeClient(
      { getService: jest.fn(() => ({ exchangeExecutionToken })) } as never,
      contextAccessor
    )
    client.onModuleInit()

    const result = await contextAccessor.run(
      createTrustedExecutionContext({
        subject: 'account-1',
        principalType: 'HUMAN',
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        requestId: 'request-1',
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        tracestate: 'vendor=value'
      }),
      () =>
        client.exchange({
          targetAudience: 'urn:oes:service:asset-service',
          requestedPermissionCodes: ['hr.employee.create']
        })
    )

    expect(result).toEqual({
      accessToken: 'a.b.c',
      tokenType: 'Bearer',
      expiresAtUnixSeconds: 2000,
      expiresInSeconds: 300,
      kid: 'kid-1',
      grantedPermissionCodes: ['hr.employee.create'],
      grantedAudience: 'urn:oes:service:asset-service'
    })
    const [request, metadata] = exchangeExecutionToken.mock.calls[0]
    expect(request).toEqual({
      targetAudience: 'urn:oes:service:asset-service',
      requestedPermissionCodes: ['hr.employee.create']
    })
    expect(metadata.get('x-request-id')).toEqual(['request-1'])
    expect(metadata.get('traceparent')).toEqual([
      '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
    ])
    expect(metadata.get('tracestate')).toEqual(['vendor=value'])
    expect(metadata.get('x-operator-context')).toEqual([])
    expect(metadata.get('x-internal-service-name')).toEqual([])
  })
})
