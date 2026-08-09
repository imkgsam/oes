import { ResolveMachinePrincipalForAuthHandler } from '../../src/application/queries/service-account/resolve-machine-principal-for-auth.handler'
import { ResolveMachinePrincipalForAuthQuery } from '../../src/application/queries/service-account/resolve-machine-principal-for-auth.query'

/** Proves Auth receives owner facts only for an exact active internal MACHINE binding. */
describe('ResolveMachinePrincipalForAuthHandler', () => {
  it('returns allowed facts only when principal, active binding, version and SPIFFE match exactly', async () => {
    const handler = new ResolveMachinePrincipalForAuthHandler(
      {
        findById: jest.fn().mockResolvedValue({
          id: 'machine-1', tenantId: 'tenant-1', scopeLevel: 'TENANT', type: 'AUTOMATION_BOT', status: 'ACTIVE', updatedAt: new Date('2026-08-06T00:00:00.000Z')
        })
      } as never,
      {
        findById: jest.fn().mockResolvedValue({
          id: 'binding-1', serviceAccountId: 'machine-1', workloadSpiffeId: 'spiffe://oes/workload/robot', status: 'ACTIVE', version: 4n
        }), recordResolution: jest.fn().mockResolvedValue(undefined)
      } as never
    )

    await expect(handler.execute(new ResolveMachinePrincipalForAuthQuery({
      machinePrincipalId: 'machine-1', bindingId: 'binding-1', bindingVersion: 4n, workloadSpiffeId: 'spiffe://oes/workload/robot'
    }))).resolves.toMatchObject({
      allowed: true, machinePrincipalId: 'machine-1', principalType: 'MACHINE', machineType: 'AUTOMATION_BOT', scopeLevel: 'TENANT', tenantId: 'tenant-1', machineWorkloadBindingId: 'binding-1', machineWorkloadBindingVersion: 4n, workloadSpiffeId: 'spiffe://oes/workload/robot', reasonCode: ''
    })
  })

  it('denies a stale binding before exposing principal facts', async () => {
    const handler = new ResolveMachinePrincipalForAuthHandler(
      { findById: jest.fn() } as never,
      {
        findById: jest.fn().mockResolvedValue({
          id: 'binding-1', serviceAccountId: 'machine-1', workloadSpiffeId: 'spiffe://oes/workload/robot', status: 'ACTIVE', version: 5n
        }), recordResolution: jest.fn().mockResolvedValue(undefined)
      } as never
    )

    await expect(handler.execute(new ResolveMachinePrincipalForAuthQuery({
      machinePrincipalId: 'machine-1', bindingId: 'binding-1', bindingVersion: 4n, workloadSpiffeId: 'spiffe://oes/workload/robot'
    }))).resolves.toEqual({
      allowed: false, machinePrincipalId: 'machine-1', machineWorkloadBindingId: 'binding-1', reasonCode: 'MACHINE_WORKLOAD_BINDING_STALE', decisionReference: ''
    })
  })
})
