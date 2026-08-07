import { DisableMachineWorkloadBindingCommand } from '../../src/application/commands/service-account/disable-machine-workload-binding.command'
import { DisableMachineWorkloadBindingHandler } from '../../src/application/commands/service-account/disable-machine-workload-binding.handler'
import { EnrollMachineWorkloadBindingCommand } from '../../src/application/commands/service-account/enroll-machine-workload-binding.command'
import { EnrollMachineWorkloadBindingHandler } from '../../src/application/commands/service-account/enroll-machine-workload-binding.handler'

/** Exercises the lifecycle semantics that must stay behind Identity's workload-binding repository. */
describe('Machine workload binding management handlers', () => {
  const activeBinding = {
    id: 'binding-1',
    serviceAccountId: 'machine-1',
    workloadSpiffeId: 'spiffe://oes/workload/robot',
    status: 'ACTIVE' as const,
    version: 1n,
    createdAt: new Date('2026-08-06T00:00:00.000Z'),
    disabledAt: null,
    disableReasonCode: null,
    enrollmentAuditRef: 'audit-enroll-1',
    disableAuditRef: null
  }

  it('returns the existing active exact binding for an idempotent enrollment', async () => {
    const bindingRepository = {
      findActiveByPrincipalAndSpiffe: jest.fn().mockResolvedValue(activeBinding),
      create: jest.fn()
    }
    const serviceAccountRepository = { findById: jest.fn() }
    const handler = new EnrollMachineWorkloadBindingHandler(
      serviceAccountRepository as never,
      bindingRepository as never
    )

    await expect(
      handler.execute(
        new EnrollMachineWorkloadBindingCommand({
          machinePrincipalId: 'machine-1',
          workloadSpiffeId: 'spiffe://oes/workload/robot',
          idempotencyKey: 'request-1',
          operatorId: 'operator-1'
        })
      )
    ).resolves.toEqual(activeBinding)

    expect(bindingRepository.create).not.toHaveBeenCalled()
  })

  it('creates an active binding only for an active eligible internal machine principal', async () => {
    const bindingRepository = {
      findActiveByPrincipalAndSpiffe: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(activeBinding)
    }
    const serviceAccountRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'machine-1',
        type: 'AUTOMATION_BOT',
        status: 'ACTIVE'
      })
    }
    const handler = new EnrollMachineWorkloadBindingHandler(
      serviceAccountRepository as never,
      bindingRepository as never
    )

    await expect(
      handler.execute(
        new EnrollMachineWorkloadBindingCommand({
          machinePrincipalId: 'machine-1',
          workloadSpiffeId: 'spiffe://oes/workload/robot',
          idempotencyKey: 'request-1',
          operatorId: 'operator-1'
        })
      )
    ).resolves.toEqual(activeBinding)

    expect(bindingRepository.create).toHaveBeenCalledWith({
      serviceAccountId: 'machine-1',
      workloadSpiffeId: 'spiffe://oes/workload/robot',
      operatorId: 'operator-1',
      idempotencyKey: 'request-1'
    })
  })

  it('uses an exact version for irreversible disable and returns the stored original on retry', async () => {
    const bindingRepository = {
      disable: jest.fn().mockResolvedValue({ binding: { ...activeBinding, status: 'DISABLED', version: 2n }, alreadyDisabled: true })
    }
    const handler = new DisableMachineWorkloadBindingHandler(bindingRepository as never)

    await expect(
      handler.execute(
        new DisableMachineWorkloadBindingCommand({
          bindingId: 'binding-1',
          expectedVersion: 1n,
          reasonCode: 'OPERATOR_REQUEST',
          operatorId: 'operator-1'
        })
      )
    ).resolves.toEqual({ binding: { ...activeBinding, status: 'DISABLED', version: 2n }, alreadyDisabled: true })

    expect(bindingRepository.disable).toHaveBeenCalledWith({
      bindingId: 'binding-1',
      expectedVersion: 1n,
      reasonCode: 'OPERATOR_REQUEST',
      operatorId: 'operator-1'
    })
  })
})
