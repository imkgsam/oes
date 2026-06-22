import { BadRequestException } from '@nestjs/common'
import { AnnotationBffService } from './annotation-bff.service'

const source = {
  requestId: 'request-1',
  traceId: 'trace-1',
  user: {
    aid: 'account-1',
    tid: 'tenant-1',
    userId: 'user-1',
    displayName: '陈双鹏'
  }
}

describe('AnnotationBffService', () => {
  let commandAdapter: { call: jest.Mock }
  let queryAdapter: { listAnnotationsForObject: jest.Mock; getAnnotation: jest.Mock }
  let service: AnnotationBffService

  beforeEach(() => {
    commandAdapter = {
      call: jest.fn().mockResolvedValue({ annotation: { annotationId: 'annotation-1' } })
    }
    queryAdapter = {
      listAnnotationsForObject: jest.fn().mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 }),
      getAnnotation: jest.fn()
    }
    service = new AnnotationBffService(commandAdapter as never, queryAdapter as never)
  })

  it('maps object-scoped list requests to collaboration-service query context', async () => {
    await service.listAnnotationsForObject(
      'crm-service',
      'CrmAccount',
      'crm-account-1',
      { page: 2, pageSize: 10 },
      source
    )

    expect(queryAdapter.listAnnotationsForObject).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        operatorContext: { accountId: 'account-1', userId: 'user-1', tenantId: 'tenant-1', displayName: '陈双鹏' },
        traceContext: { traceId: 'trace-1' },
        objectRef: {
          objectOwnerService: 'crm-service',
          objectType: 'CrmAccount',
          objectId: 'crm-account-1'
        },
        includePrivate: true,
        page: 2,
        pageSize: 10
      }),
      source
    )
  })

  it('maps create and pin commands with audit context and proto visibility', async () => {
    await service.createAnnotation(
      'crm-service',
      'CrmAccount',
      'crm-account-1',
      { bodyText: 'Account note', visibility: 'PRIVATE' },
      source
    )
    await service.setAnnotationPinned('annotation-1', { pinned: true }, source)

    expect(commandAdapter.call).toHaveBeenCalledWith(
      'createAnnotation',
      expect.objectContaining({
        tenantId: 'tenant-1',
        operatorContext: expect.objectContaining({ displayName: '陈双鹏' }),
        auditContext: { auditId: 'request-1', source: 'api-gateway' },
        visibility: 1
      }),
      source
    )
    expect(commandAdapter.call).toHaveBeenCalledWith(
      'setAnnotationPinned',
      expect.objectContaining({
        annotationId: 'annotation-1',
        pinned: true
      }),
      source
    )
  })

  it('rejects requests without tenant context before calling downstream services', async () => {
    await expect(
      service.listAnnotationsForObject('crm-service', 'CrmAccount', 'crm-account-1', {}, { user: { aid: 'account-1' } })
    ).rejects.toThrow(BadRequestException)
    expect(queryAdapter.listAnnotationsForObject).not.toHaveBeenCalled()
  })
})
