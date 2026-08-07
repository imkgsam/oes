import { MachineWorkloadBindingEntity } from '../../domain/entities/machine-workload-binding.entity'
import type { MachineWorkloadBinding } from '../../../prisma/generated/prisma/index'

/** Maps local Prisma binding rows into Identity's complete workload-binding lifecycle fact. */
export class PrismaMachineWorkloadBindingMapper {
  static toDomain(row: MachineWorkloadBinding): MachineWorkloadBindingEntity {
    return new MachineWorkloadBindingEntity(
      row.id,
      row.serviceAccountId,
      row.workloadSpiffeId,
      row.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
      BigInt(row.version),
      row.createdAt,
      row.disabledAt,
      row.disableReasonCode,
      row.enrollmentAuditRef,
      row.disableAuditRef
    )
  }
}
