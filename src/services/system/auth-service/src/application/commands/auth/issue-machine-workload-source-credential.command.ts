import { Allow } from 'class-validator'

/** Requests issuance using only non-secret selectors and transport-derived workload evidence. */
export class IssueMachineWorkloadSourceCredentialCommand {
  constructor(
    @Allow()
    public readonly input: {
      machinePrincipalId: string
      bindingId: string
      bindingVersion: bigint
      workloadIdentity: {
        spiffeId: string
        certificateThumbprint: string
        certificateNotAfter: Date
      }
    }
  ) {}
}
