import { MachineWorkloadBindingEntity } from '../entities/machine-workload-binding.entity'

/** Defines Identity's transactional persistence boundary for exact MACHINE workload binding lifecycle facts. */
export interface MachineWorkloadBindingRepository {
  findById(id: string): Promise<MachineWorkloadBindingEntity | null>
  findActiveByPrincipalAndSpiffe(
    serviceAccountId: string,
    workloadSpiffeId: string
  ): Promise<MachineWorkloadBindingEntity | null>
  create(input: {
    serviceAccountId: string
    workloadSpiffeId: string
    operatorId?: string
    idempotencyKey: string
  }): Promise<MachineWorkloadBindingEntity>
  disable(input: {
    bindingId: string
    expectedVersion: bigint
    reasonCode: string
    operatorId?: string
  }): Promise<{ binding: MachineWorkloadBindingEntity; alreadyDisabled: boolean }>
}
