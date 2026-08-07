/** Represents Auth-owned, non-bearer persistence facts for one certificate-bound MACHINE source credential. */
export class MachineWorkloadSourceCredentialEntity {
  constructor(
    public readonly id: string,
    public readonly machinePrincipalId: string,
    public readonly machineWorkloadBindingId: string,
    public readonly machineWorkloadBindingVersion: bigint,
    public readonly workloadSpiffeId: string,
    public readonly certificateThumbprint: string,
    public readonly certificateNotAfter: Date,
    public readonly signingKid: string,
    public readonly issuedAt: Date,
    public readonly expiresAt: Date,
    public readonly status: 'ACTIVE' | 'SUPERSEDED' | 'REVOKED',
    public readonly auditId: string,
    public readonly revokedAt: Date | null = null,
    public readonly revokedReasonCode: string | null = null
  ) {}
}
