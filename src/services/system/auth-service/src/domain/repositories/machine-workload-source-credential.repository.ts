import { MachineWorkloadSourceCredentialEntity } from '../entities/machine-workload-source-credential.entity'

/** Defines Auth's local transactional boundary for source credential lifecycle state and audit facts. */
export interface MachineWorkloadSourceCredentialRepository {
  issue(input: Record<string, unknown>): Promise<MachineWorkloadSourceCredentialEntity>
  findById(id: string): Promise<MachineWorkloadSourceCredentialEntity | null>
  revoke(input: { credentialId: string; reasonCode: string; operatorId?: string }): Promise<{ credential: MachineWorkloadSourceCredentialEntity; alreadyRevoked: boolean }>
  recordVerificationOutcome(input: { credentialId?: string; eventType: 'MACHINE_SOURCE_CREDENTIAL_VERIFIED' | 'MACHINE_SOURCE_CREDENTIAL_REJECTED'; reasonCode: string; workloadSpiffeId?: string }): Promise<void>
}
