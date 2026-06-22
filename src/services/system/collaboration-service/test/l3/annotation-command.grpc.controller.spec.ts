import { BadRequestException } from '@nestjs/common'
import {
  AnnotationVisibility as ProtoAnnotationVisibility
} from '@oes/common/generated/collaboration_service'
import { AnnotationCommandService } from '../../src/application/services/annotation-command.service'
import { AnnotationEntity } from '../../src/domain/entities/annotation.entity'
import { AnnotationVisibility } from '../../src/domain/value-objects/annotation.enums'
import { AnnotationCommandGrpcController } from '../../src/interfaces/grpc/annotation-command.grpc.controller'

const TENANT_ID = 'tenant-1'
const ACCOUNT_ID = 'account-1'
const TRACE_ID = 'trace-1'
const AUDIT_ID = 'audit-1'
const OBJECT_REF = {
  objectOwnerService: 'crm-service',
  objectType: 'CrmAccount',
  objectId: 'crm-account-1'
}

describe('AnnotationCommandGrpcController', () => {
  let service: jest.Mocked<AnnotationCommandService>
  let controller: AnnotationCommandGrpcController

  beforeEach(() => {
    service = {
      createAnnotation: jest.fn(),
      updateAnnotation: jest.fn(),
      deleteAnnotation: jest.fn(),
      setAnnotationPinned: jest.fn()
    } as unknown as jest.Mocked<AnnotationCommandService>
    controller = new AnnotationCommandGrpcController(service)
  })

  it('rejects command requests that omit audit context', async () => {
    await expect(
      controller.createAnnotation({
        tenantId: TENANT_ID,
        operatorContext: { accountId: ACCOUNT_ID, userId: 'user-1', tenantId: TENANT_ID },
        traceContext: { traceId: TRACE_ID, spanId: 'span-1' },
        objectRef: OBJECT_REF,
        bodyText: 'Account note'
      })
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(service.createAnnotation).not.toHaveBeenCalled()
  })

  it('maps CreateAnnotation into the application command and presents the saved note', async () => {
    service.createAnnotation.mockResolvedValue(buildAnnotation({ visibility: AnnotationVisibility.PRIVATE }))

    const response = await controller.createAnnotation({
      tenantId: TENANT_ID,
      operatorContext: { accountId: ACCOUNT_ID, userId: 'user-1', tenantId: TENANT_ID },
      traceContext: { traceId: TRACE_ID, spanId: 'span-1' },
      auditContext: { auditId: AUDIT_ID, reason: 'manual', source: 'tenant-web' },
      objectRef: OBJECT_REF,
      bodyText: 'Account note',
      visibility: ProtoAnnotationVisibility.ANNOTATION_VISIBILITY_PRIVATE
    })

    expect(service.createAnnotation).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        operatorAccountId: ACCOUNT_ID,
        traceId: TRACE_ID,
        auditId: AUDIT_ID,
        objectRef: OBJECT_REF,
        bodyText: 'Account note',
        visibility: AnnotationVisibility.PRIVATE
      })
    )
    expect(response.annotation).toMatchObject({
      annotationId: 'annotation-1',
      visibility: ProtoAnnotationVisibility.ANNOTATION_VISIBILITY_PRIVATE,
      objectRef: OBJECT_REF
    })
  })

  it('maps pin commands without allowing missing context through', async () => {
    service.setAnnotationPinned.mockResolvedValue(buildAnnotation({ pinned: true }))

    const response = await controller.setAnnotationPinned({
      tenantId: TENANT_ID,
      operatorContext: { accountId: ACCOUNT_ID, userId: 'user-1', tenantId: TENANT_ID },
      traceContext: { traceId: TRACE_ID, spanId: 'span-1' },
      auditContext: { auditId: AUDIT_ID, reason: 'pin', source: 'tenant-web' },
      annotationId: 'annotation-1',
      pinned: true
    })

    expect(service.setAnnotationPinned).toHaveBeenCalledWith(
      expect.objectContaining({
        annotationId: 'annotation-1',
        pinned: true
      })
    )
    expect(response.annotation?.pinned).toBe(true)
  })
})

/** buildAnnotation creates one aggregate returned by mocked command handlers. */
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
