import { CallHandler, ExecutionContext } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import {
  INTERNAL_SERVICE_NAME_METADATA_KEY,
  REQUEST_ID_METADATA_KEY,
  TRACE_ID_METADATA_KEY
} from '../constants'
import { attachInternalService, attachOperatorContext } from '../utils'
import { GrpcRequestContextInterceptor } from './grpc-request-context.interceptor'
import { GrpcRequestContextStore } from '../services/grpc-request-context.store'

describe('GrpcRequestContextInterceptor', () => {
  it('should write authenticated grpc context and metadata into the request context store', (done) => {
    const store = new GrpcRequestContextStore()
    const interceptor = new GrpcRequestContextInterceptor(store)

    const rpcData: Record<string, unknown> = {}
    attachInternalService(rpcData, 'api-gateway')
    attachOperatorContext(rpcData, {
      operator_id: 'operator-1',
      operator_type: 'USER',
      tenant_id: 'tenant-1',
      org_id: 'org-1',
      issued_at: '2026-04-05T10:00:00.000Z',
      expires_at: '2026-04-05T10:05:00.000Z',
      issuer: 'api-gateway',
      operator_roles: ['role-1'],
      request_id: 'req-1',
      trace_id: 'trace-1',
      signature: 'signature'
    })

    const metadata = new Metadata()
    metadata.set(INTERNAL_SERVICE_NAME_METADATA_KEY, 'api-gateway')
    metadata.set(REQUEST_ID_METADATA_KEY, 'req-1')
    metadata.set(TRACE_ID_METADATA_KEY, 'trace-1')

    const context = {
      getType: jest.fn(() => 'rpc'),
      switchToRpc: jest.fn(() => ({
        getData: () => rpcData,
        getContext: () => metadata
      }))
    } as unknown as ExecutionContext

    const next: CallHandler = {
      handle: jest.fn(() => {
        const current = store.getContext()
        expect(current).toEqual({
          internalServiceName: 'api-gateway',
          operatorContext: expect.objectContaining({
            operator_id: 'operator-1',
            tenant_id: 'tenant-1',
            org_id: 'org-1'
          }),
          requestId: 'req-1',
          traceId: 'trace-1'
        })

        return of('ok')
      })
    }

    interceptor.intercept(context, next).subscribe({
      next: (value) => expect(value).toBe('ok'),
      error: done,
      complete: done
    })
  })
})
