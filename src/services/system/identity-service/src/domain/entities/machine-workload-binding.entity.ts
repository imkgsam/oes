/** Represents Identity-owned lifecycle facts that bind one internal Machine Principal to an exact SPIFFE workload. */
export class MachineWorkloadBindingEntity {
  constructor(
    public readonly id: string,
    public readonly serviceAccountId: string,
    public readonly workloadSpiffeId: string,
    public readonly idempotencyKey: string,
    public readonly status: 'ACTIVE' | 'DISABLED',
    public readonly version: bigint,
    public readonly createdAt: Date,
    public readonly disabledAt: Date | null,
    public readonly disableReasonCode: string | null,
    public readonly enrollmentAuditRef: string,
    public readonly disableAuditRef: string | null
  ) {}
}
