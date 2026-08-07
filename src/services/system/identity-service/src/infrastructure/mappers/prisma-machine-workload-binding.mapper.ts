import { MachineWorkloadBindingEntity } from '../../domain/entities/machine-workload-binding.entity'

/** Maps local Prisma binding rows into Identity's complete workload-binding lifecycle fact. */
export class PrismaMachineWorkloadBindingMapper {
  static toDomain(row: any): MachineWorkloadBindingEntity {
    return new MachineWorkloadBindingEntity(
      row.id,
      row.serviceAccountId,
      row.workloadSpiffeId,
      row.status,
      BigInt(row.version),
      row.createdAt ?? new Date(0),
      row.disabledAt ?? null,
      row.disableReasonCode ?? null,
      row.enrollmentAuditRef ?? '',
      row.disableAuditRef ?? null
    )
  }
}
