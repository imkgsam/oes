import { ResolveIntegrationMachineForAuthHandler } from '../application/queries/service-account/resolve-integration-machine-for-auth.handler'
import { ResolveIntegrationMachineForAuthQuery } from '../application/queries/service-account/resolve-integration-machine-for-auth.query'

describe('ResolveIntegrationMachineForAuthHandler', () => {
  it('returns only active tenant external-integration machine facts', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue({
        id: 'machine-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        type: 'EXTERNAL_INTEGRATION',
        status: 'ACTIVE',
        updatedAt: new Date('2026-08-01T00:00:00.000Z')
      })
    }
    const handler = new ResolveIntegrationMachineForAuthHandler(repository as never)

    await expect(handler.execute(new ResolveIntegrationMachineForAuthQuery('machine-1'))).resolves.toEqual({
      eligible: true,
      integrationMachineId: 'machine-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      machineType: 'EXTERNAL_INTEGRATION',
      lifecycleStatus: 'ACTIVE',
      lifecycleVersion: '2026-08-01T00:00:00.000Z',
      decisionReference: 'identity-machine:machine-1:2026-08-01T00:00:00.000Z',
      reasonCode: ''
    })
  })

  it('fails closed when the requested machine is missing or not an active tenant integration', async () => {
    const repository = { findById: jest.fn().mockResolvedValue(null) }
    const handler = new ResolveIntegrationMachineForAuthHandler(repository as never)

    await expect(handler.execute(new ResolveIntegrationMachineForAuthQuery('missing'))).resolves.toMatchObject({
      eligible: false,
      reasonCode: 'INTEGRATION_MACHINE_NOT_FOUND'
    })
  })
})
