import { Metadata } from '@grpc/grpc-js'
const { of } = require('rxjs')
const {
  INTERNAL_SERVICE_NAME_METADATA_KEY,
  REQUEST_ID_METADATA_KEY,
  TRACE_ID_METADATA_KEY
} = require('../../../../src/authorization/constants')
const {
  attachInternalService,
  attachOperatorContext,
  attachVerifiedExecution
} = require('../../../../src/authorization/utils')
const { GrpcRequestContextInterceptor } = require('../../../../src/authorization/interceptors/grpc-request-context.interceptor')
const { GrpcRequestContextStore } = require('../../../../src/authorization/services/grpc-request-context.store')

describe('GrpcRequestContextInterceptor', () => {
  it('should write authenticated grpc context and metadata into the request context store', (done) => {
    const store = new GrpcRequestContextStore()
    const interceptor = new GrpcRequestContextInterceptor(store)

    const rpcData = {}
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
    attachVerifiedExecution(rpcData, {
      verifiedExecutionToken: {
        issuer: 'https://auth.local.oes.example',
        audience: 'urn:oes:service:auth-service',
        subject: 'api-gateway',
        principalType: 'MACHINE',
        clientId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
        tenantId: 'SYSTEM',
        permissionCodes: ['auth.internal.external_api_key.exchange'],
        tokenId: 'token-1',
        issuedAt: 1,
        notBefore: 1,
        expiresAt: 2,
        certificateThumbprint: 'A'.repeat(43)
      },
      verifiedWorkloadIdentity: {
        spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
        certificateThumbprint: 'A'.repeat(43)
      }
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
    }

    const next = {
      handle: jest.fn(() => {
        const current = store.getContext()
        expect(current).toEqual({
          internalServiceName: 'api-gateway',
          operatorContext: expect.objectContaining({
            operator_id: 'operator-1',
            tenant_id: 'tenant-1',
            org_id: 'org-1'
          }),
          verifiedExecutionToken: expect.objectContaining({
            subject: 'api-gateway',
            permissionCodes: ['auth.internal.external_api_key.exchange']
          }),
          verifiedWorkloadIdentity: expect.objectContaining({
            spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway'
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
