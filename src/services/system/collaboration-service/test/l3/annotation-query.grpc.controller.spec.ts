import { BadRequestException } from '@nestjs/common'
import { attachVerifiedExecution, RPC_OPERATOR_CONTEXT_KEY } from '@oes/common/authorization'
import {
  AnnotationVisibility as ProtoAnnotationVisibility
} from '@oes/common/generated/collaboration_service'
import { AnnotationQueryService } from '../../src/application/services/annotation-query.service'
import { AnnotationEntity } from '../../src/domain/entities/annotation.entity'
import { AnnotationVisibility } from '../../src/domain/value-objects/annotation.enums'
import { AnnotationQueryGrpcController } from '../../src/interfaces/grpc/annotation-query.grpc.controller'

const TENANT_ID = 'tenant-1'
const ACCOUNT_ID = 'account-1'
const TRACE_ID = 'trace-1'
const OBJECT_REF = {
  objectOwnerService: 'crm-service',
  objectType: 'CrmAccount',
  objectId: 'crm-account-1'
}

describe('AnnotationQueryGrpcController', () => {
  let service: jest.Mocked<AnnotationQueryService>
  let controller: AnnotationQueryGrpcController

  beforeEach(() => {
    service = {
      listAnnotationsForObject: jest.fn(),
      getAnnotation: jest.fn()
    } as unknown as jest.Mocked<AnnotationQueryService>
    controller = new AnnotationQueryGrpcController(service)
  })

  it('maps list requests into the query service and presents visible notes', async () => {
    service.listAnnotationsForObject.mockResolvedValue({
      items: [buildAnnotation({ visibility: AnnotationVisibility.PRIVATE })],
      page: 2,
      pageSize: 10,
      total: 1
    })

    const response = await controller.listAnnotationsForObject(trusted({
      objectRef: OBJECT_REF,
      includePrivate: true,
      page: 2,
      pageSize: 10
    }))

    expect(service.listAnnotationsForObject).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        operatorAccountId: ACCOUNT_ID,
        traceId: TRACE_ID,
        objectRef: OBJECT_REF,
        includePrivate: true,
        page: 2,
        pageSize: 10
      })
    )
    expect(response).toMatchObject({
      page: 2,
      pageSize: 10,
      total: 1,
      items: [
        {
          annotationId: 'annotation-1',
          visibility: ProtoAnnotationVisibility.ANNOTATION_VISIBILITY_PRIVATE
        }
      ]
    })
  })

  it('rejects body authority when the trusted guard context is absent', async () => {
    await expect(
      controller.listAnnotationsForObject({
        tenantId: TENANT_ID,
        traceContext: { traceId: TRACE_ID, spanId: 'span-1' },
        objectRef: OBJECT_REF
      })
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(service.listAnnotationsForObject).not.toHaveBeenCalled()
  })
})

/** buildAnnotation creates one aggregate returned by mocked query handlers. */
function buildAnnotation(overrides: Partial<ConstructorParameters<typeof AnnotationEntity>[0]> = {}) {
  return new AnnotationEntity({
    id: 'annotation-1',
    tenantId: TENANT_ID,
    objectOwnerService: OBJECT_REF.objectOwnerService,
    objectType: OBJECT_REF.objectType,
    objectId: OBJECT_REF.objectId,
    objectDisplayTitle: 'Northwind Traders',
    objectDisplaySubtitle: 'CRM-1001',
    objectDisplayStatus: 'ACTIVE',
    authorAccountId: ACCOUNT_ID,
    authorDisplayNameSnapshot: ACCOUNT_ID,
    bodyText: 'Account note',
    visibility: AnnotationVisibility.OBJECT_VISIBLE,
    pinned: false,
    edited: false,
    deletedAt: null,
    deletedByAccountId: null,
    deleteReason: null,
    createdAt: new Date('2026-06-18T08:00:00.000Z'),
    updatedAt: new Date('2026-06-18T08:00:00.000Z'),
    ...overrides
  })
}

/** trusted binds verified execution claims as the guard does before controller invocation. */
function trusted<T extends object>(request: T): T {
  attachVerifiedExecution(request, {
    verifiedExecutionToken: { tenantId: TENANT_ID, subject: ACCOUNT_ID, principalType: 'HUMAN', sessionTerminal: 'WEB' } as any,
    verifiedWorkloadIdentity: {} as any
  })
  Object.assign((request as Record<string, unknown>)[RPC_OPERATOR_CONTEXT_KEY] as object, { traceId: TRACE_ID, requestId: 'request-1' })
  return request
}
