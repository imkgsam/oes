import { ArgumentsHost, ForbiddenException } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { status } from '@grpc/grpc-js'
import { getTraceId } from '@oes/common/tracing'
import { GatewayExceptionFilter } from './gateway-exception.filter'

jest.mock('@oes/common/tracing', () => ({
  getTraceId: jest.fn(() => 'trace-1'),
  recordExceptionToActiveSpan: jest.fn()
}))

// Verifies gateway gRPC exception mapping preserves FAILED_PRECONDITION semantics instead of collapsing them into pseudo-500 responses.
describe('GatewayExceptionFilter', () => {
  it('maps FAILED_PRECONDITION RpcException values to HTTP 412', () => {
    const logger = {
      error: jest.fn(),
      warn: jest.fn()
    }
    const filter = new GatewayExceptionFilter(logger as any)
    const json = jest.fn()
    const res = {
      status: jest.fn(() => ({ json }))
    }
    const req = {
      header: jest.fn(() => 'request-1'),
      method: 'PUT',
      originalUrl: '/item-management/tenants/tenant-1/items/item-1/composition'
    }
    const host = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res
      })
    } as ArgumentsHost

    filter.catch(
      new RpcException({
        grpcStatus: status.FAILED_PRECONDITION,
        code: 'ITEM_MASTER_PRECONDITION_FAILED',
        message: 'Bundle composition can only be updated for bundle items'
      }),
      host
    )

    expect(res.status).toHaveBeenCalledWith(412)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'ITEM_MASTER_PRECONDITION_FAILED',
        message: 'Bundle composition can only be updated for bundle items'
      })
    )
  })

  it('uses an exact inbound W3C trace id when an active span is unavailable on denial', () => {
    jest.mocked(getTraceId).mockReturnValueOnce('unknown')
    const logger = { error: jest.fn(), warn: jest.fn() }
    const filter = new GatewayExceptionFilter(logger as any)
    const json = jest.fn()
    const res = { status: jest.fn(() => ({ json })) }
    const traceId = '4bf92f3577b34da6a3ce929d0e0e4736'
    const requestId = 'request-denied-1'
    const headers: Record<string, string> = {
      traceparent: `00-${traceId}-00f067aa0ba902b7-01`,
      'x-request-id': requestId
    }
    const req = {
      header: jest.fn((name: string) => headers[name.toLowerCase()]),
      method: 'POST',
      originalUrl: '/collaboration/tenants/tenant-1/tasks'
    }
    const host = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res
      })
    } as ArgumentsHost

    filter.catch(new ForbiddenException('Denied'), host)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ meta: expect.objectContaining({ requestId, traceId }) })
    )
    expect(logger.warn).toHaveBeenCalledWith('HttpException', expect.objectContaining({ traceId }))
  })
})
