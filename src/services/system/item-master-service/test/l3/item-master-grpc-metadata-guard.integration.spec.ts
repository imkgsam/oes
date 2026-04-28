import { CallHandler, ExecutionContext } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { Metadata } from '@grpc/grpc-js'
import { ConfigService } from '@nestjs/config'
import { lastValueFrom, Observable } from 'rxjs'
import {
  GrpcRequestContextInterceptor,
  GrpcRequestContextStore,
  INTERNAL_SERVICE_AUTHENTICATOR,
  OPERATOR_CONTEXT_VERIFIER
} from '@oes/common/authorization'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { DefaultInternalServiceAuthenticator } from '@oes/common/authorization'
import { AppLogger } from '@oes/common/logging'
import { ItemMasterQueryGrpcController } from '../../src/interfaces/grpc/item-master-query.grpc.controller'
import { ItemMasterRpcContextGuard } from '../../src/interfaces/grpc/item-master-rpc-context.guard'

function createExecutionContext(
  controller: ItemMasterQueryGrpcController,
  handlerName: keyof ItemMasterQueryGrpcController,
  rpcData: Record<string, unknown>,
  metadata: Metadata
): ExecutionContext {
  return {
    getClass: () => controller.constructor,
    getHandler: () => controller[handlerName] as never,
    getType: () => 'rpc',
    switchToRpc: () => ({
      getData: () => rpcData,
      getContext: () => metadata
    })
  } as ExecutionContext
}

function createMetadata(input: {
  internalServiceName?: string
  operatorContext?: string
  requestId?: string
  traceId?: string
}): Metadata {
  const metadata = new Metadata()

  if (input.internalServiceName) {
    metadata.set('x-internal-service-name', input.internalServiceName)
  }
  if (input.operatorContext) {
    metadata.set('x-operator-context', input.operatorContext)
  }
  if (input.requestId) {
    metadata.set('x-request-id', input.requestId)
  }
  if (input.traceId) {
    metadata.set('x-trace-id', input.traceId)
  }

  return metadata
}

describe('Item master gRPC metadata guard integration L3', () => {
  async function buildHarness(options?: {
    trustedServices?: string
    operatorVerifyResult?: { valid: boolean; payload?: Record<string, unknown>; reason?: string }
  }) {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20
      })
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [ItemMasterQueryGrpcController],
      providers: [
        ItemMasterRpcContextGuard,
        GrpcRequestContextStore,
        GrpcRequestContextInterceptor,
        DefaultInternalServiceAuthenticator,
        {
          provide: ValidatingQueryBus,
          useValue: queryBus
        },
        {
          provide: AppLogger,
          useValue: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            log: jest.fn(),
            setContext: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'INTERNAL_SERVICE_TRUSTED_SERVICES') {
                return options?.trustedServices
              }
              return undefined
            })
          }
        },
        {
          provide: INTERNAL_SERVICE_AUTHENTICATOR,
          useExisting: DefaultInternalServiceAuthenticator
        },
        {
          provide: OPERATOR_CONTEXT_VERIFIER,
          useValue: {
            verify: jest.fn().mockReturnValue(
              options?.operatorVerifyResult ?? {
                valid: true,
                payload: {
                  operator_id: 'operator-1',
                  operator_type: 'HUMAN',
                  tenant_id: 'tenant-1',
                  issued_at: '2026-04-26T00:00:00.000Z',
                  expires_at: '2026-04-26T01:00:00.000Z',
                  issuer: 'auth-service',
                  signature: 'sig',
                  request_id: 'req-1',
                  trace_id: 'trace-1'
                }
              }
            )
          }
        }
      ]
    }).compile()

    return {
      moduleRef,
      controller: moduleRef.get(ItemMasterQueryGrpcController),
      guard: moduleRef.get(ItemMasterRpcContextGuard),
      interceptor: moduleRef.get(GrpcRequestContextInterceptor),
      queryBus
    }
  }

  async function invokeSearchItems(
    harness: Awaited<ReturnType<typeof buildHarness>>,
    metadata: Metadata
  ): Promise<unknown> {
    const rpcData: Record<string, unknown> = {
      tenantId: 'tenant-1',
      page: 1,
      pageSize: 20
    }
    const executionContext = createExecutionContext(harness.controller, 'searchItems', rpcData, metadata)

    const allowed = await harness.guard.canActivate(executionContext)
    expect(allowed).toBe(true)

    return lastValueFrom(
      harness.interceptor.intercept(executionContext, {
        handle: () =>
          new Observable((subscriber) => {
            void harness.controller
              .searchItems(rpcData as never)
              .then((value) => {
                subscriber.next(value)
                subscriber.complete()
              })
              .catch((error) => subscriber.error(error))
          })
      } as CallHandler)
    )
  }

  it('when internal service metadata is missing / should reject with UNAUTHENTICATED', async () => {
    const harness = await buildHarness()

    await expect(
      invokeSearchItems(
        harness,
        createMetadata({
          operatorContext: 'valid-operator',
          requestId: 'req-1',
          traceId: 'trace-1'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: 16
      }
    })
  })

  it('when operator context metadata is missing / should reject with UNAUTHENTICATED', async () => {
    const harness = await buildHarness()

    await expect(
      invokeSearchItems(
        harness,
        createMetadata({
          internalServiceName: 'wms-service',
          requestId: 'req-1',
          traceId: 'trace-1'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: 16
      }
    })
  })

  it('when internal service is outside the trusted allowlist / should reject with PERMISSION_DENIED', async () => {
    const harness = await buildHarness({
      trustedServices: 'mes-service'
    })

    await expect(
      invokeSearchItems(
        harness,
        createMetadata({
          internalServiceName: 'wms-service',
          operatorContext: 'valid-operator',
          requestId: 'req-1',
          traceId: 'trace-1'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: 7
      }
    })
  })

  it('when trace metadata is missing / should reject with INVALID_ARGUMENT', async () => {
    const harness = await buildHarness()

    await expect(
      invokeSearchItems(
        harness,
        createMetadata({
          internalServiceName: 'wms-service',
          operatorContext: 'valid-operator',
          requestId: 'req-1'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: 3
      }
    })
  })

  it('when request metadata is missing / should reject with INVALID_ARGUMENT', async () => {
    const harness = await buildHarness()

    await expect(
      invokeSearchItems(
        harness,
        createMetadata({
          internalServiceName: 'wms-service',
          operatorContext: 'valid-operator',
          traceId: 'trace-1'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: 3
      }
    })
  })
})
