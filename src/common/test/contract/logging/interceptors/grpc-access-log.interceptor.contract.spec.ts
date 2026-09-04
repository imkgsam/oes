import { lastValueFrom, of, throwError } from 'rxjs'
import { ExecutionContext } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { AppLogger } from '../../../../src/logging/app-logger.service'
import { GrpcAccessLogInterceptor } from '../../../../src/logging/interceptors/grpc-access-log.interceptor'
import { RPC_OPERATOR_CONTEXT_KEY } from '../../../../src/authorization/constants'

describe('GrpcAccessLogInterceptor', () => {
  function createExecutionContext(metadata: Metadata, payload: Record<string, unknown>): ExecutionContext {
    return {
      getType: jest.fn().mockReturnValue('rpc'),
      switchToRpc: jest.fn().mockReturnValue({
        getData: jest.fn().mockReturnValue(payload),
        getContext: jest.fn().mockReturnValue(metadata)
      }),
      getArgByIndex: jest.fn().mockImplementation((index: number) =>
        index === 2 ? { call: { handler: { path: '/identity_service.IdentityQueryService/GetUserById' } } } : undefined
      )
    } as unknown as ExecutionContext
  }

  it('should log successful grpc request with unified fields', async () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      getServiceName: jest.fn().mockReturnValue('identity-service')
    } as unknown as AppLogger
    const interceptor = new GrpcAccessLogInterceptor(logger)
    const metadata = new Metadata()
    metadata.set('x-request-id', 'req-1')
    metadata.set('x-trace-id', 'trace-1')
    const payload = {
      [RPC_OPERATOR_CONTEXT_KEY]: {
        operatorContext: {
          operator_id: 'op-1',
          operator_type: 'HUMAN',
          issued_at: '2026-01-01T00:00:00Z',
          expires_at: '2026-01-01T01:00:00Z',
          issuer: 'test',
          signature: 'sig',
          tenant_id: 'tenant-1',
          org_id: 'org-1'
        }
      }
    }

    await lastValueFrom(
      interceptor.intercept(createExecutionContext(metadata, payload), { handle: () => of({ ok: true }) })
    )

    expect((logger as any).info).toHaveBeenCalledWith(
      'gRPC request completed',
      expect.objectContaining({
        module: 'identity-service',
        operation: '/identity_service.IdentityQueryService/GetUserById',
        requestId: 'req-1',
        traceId: 'trace-1',
        tenantId: 'tenant-1',
        orgId: 'org-1',
        operatorId: 'op-1'
      })
    )
  })

  it('should log failed grpc request with FAILED result', async () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      getServiceName: jest.fn().mockReturnValue('identity-service')
    } as unknown as AppLogger
    const interceptor = new GrpcAccessLogInterceptor(logger)
    const metadata = new Metadata()

    await expect(
      lastValueFrom(
        interceptor.intercept(createExecutionContext(metadata, {}), {
          handle: () => throwError(() => ({ code: 'AUTHORIZATION_DENIED' }))
        })
      )
    ).rejects.toEqual({ code: 'AUTHORIZATION_DENIED' })

    expect((logger as any).warn).toHaveBeenCalledWith(
      'gRPC request failed',
      expect.objectContaining({
        errorCode: 'AUTHORIZATION_DENIED',
        details: expect.objectContaining({
          result: 'FAILED',
          transport: 'grpc'
        })
      })
    )
  })
})
