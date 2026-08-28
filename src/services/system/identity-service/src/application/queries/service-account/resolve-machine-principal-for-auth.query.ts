import { Allow } from 'class-validator'

/** Requests an owner-safe decision for one Auth-verified MACHINE principal/binding/SPIFFE tuple. */
export class ResolveMachinePrincipalForAuthQuery {
  @Allow()
  public readonly input: {
    machinePrincipalId: string
    bindingId: string
    bindingVersion: bigint
    workloadSpiffeId: string
  }

  constructor(input: ResolveMachinePrincipalForAuthQuery['input']) {
    this.input = input
  }
}
