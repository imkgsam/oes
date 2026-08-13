import { status } from '@grpc/grpc-js'
import { attachVerifiedExecution } from '@oes/common/authorization'
import { MesManagementGrpcController } from '../../src/interfaces/grpc/mes-management.grpc.controller'
import { MesQueryGrpcController } from '../../src/interfaces/grpc/mes-query.grpc.controller'

/** Creates the verified HUMAN WEB execution fixture used by direct MES controller tests. */
function trusted<T extends object>(request: T): T {
  Object.assign(attachVerifiedExecution(request, { verifiedExecutionToken: { tenantId: 'tenant-1', orgId: 'org-1', subject: 'operator-1', principalType: 'HUMAN', permissionCodes: [] } as never, verifiedWorkloadIdentity: {} as never }), { requestId: 'request-1', traceId: 'trace-1' })
  return request
}

/** Creates a minimal management controller for trusted-context admission tests. */
function createManagementController() {
  return new MesManagementGrpcController({ registerMoldDesign: jest.fn() } as never, { run: jest.fn((_c, work) => work()) } as never)
}

/** Creates a minimal query controller for trusted-context admission tests. */
function createQueryController() { return new MesQueryGrpcController({ listMoldDesigns: jest.fn() } as never) }

describe('mes-service grpc context validation L3', () => {
  it('rejects requests without verified execution context before body data', async () => {
    await expect(createManagementController().registerMoldDesign({ designCode: 'WB-A100' } as never)).rejects.toThrow('Trusted execution context is required')
  })

  it('accepts verified context even when legacy body authority is absent', async () => {
    const service = { registerMoldDesign: jest.fn().mockResolvedValue({ moldDesignId: 'design-1', tenantId: 'tenant-1', orgId: 'org-1', primaryItemModelRef: { itemModelId: 'model-1' }, productionSpecRefs: [], outputs: [] }) }
    const controller = new MesManagementGrpcController(service as never, { run: jest.fn((_c, work) => work()) } as never)
    await controller.registerMoldDesign(trusted({ commandId: 'cmd-1', designCode: 'WB-A100', name: 'Design' }) as never)
    expect(service.registerMoldDesign).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1', operatorContext: expect.objectContaining({ operatorId: 'operator-1' }) }))
  })

  it('ignores conflicting legacy body tenant/operator/trace/audit fields', async () => {
    const service = { registerMoldDesign: jest.fn().mockResolvedValue({ moldDesignId: 'design-1', tenantId: 'tenant-1', orgId: 'org-1', primaryItemModelRef: { itemModelId: 'model-1' }, productionSpecRefs: [], outputs: [] }) }
    const controller = new MesManagementGrpcController(service as never, { run: jest.fn((_c, work) => work()) } as never)
    await controller.registerMoldDesign(trusted({ tenantId: 'attacker', operatorContext: { operatorId: 'attacker' }, traceContext: { requestId: 'attacker', traceId: 'attacker' }, auditContext: { auditId: 'attacker', reason: 'attacker', source: 'attacker' }, commandId: 'cmd-1', designCode: 'WB-A100', name: 'Design' }) as never)
    expect(service.registerMoldDesign).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1', operatorContext: expect.objectContaining({ operatorId: 'operator-1' }) }))
  })

  it('uses trusted context for query paths', async () => {
    const service = { listMoldDesigns: jest.fn().mockResolvedValue({ moldDesigns: [], total: 0, page: 1, pageSize: 20 }) }
    await new MesQueryGrpcController(service as never).listMoldDesigns(trusted({ keyword: 'WB' }) as never)
    expect(service.listMoldDesigns).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1' }))
  })

  it('rejects query requests without trusted execution context', async () => {
    await expect(createQueryController().listMoldDesigns({ keyword: 'WB' } as never)).rejects.toThrow('Trusted execution context is required')
  })
})
