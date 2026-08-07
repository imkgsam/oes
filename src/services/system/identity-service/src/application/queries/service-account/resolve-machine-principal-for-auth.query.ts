/** Requests an owner-safe decision for one Auth-verified MACHINE principal/binding/SPIFFE tuple. */
export class ResolveMachinePrincipalForAuthQuery { constructor(public readonly input: { machinePrincipalId: string; bindingId: string; bindingVersion: bigint; workloadSpiffeId: string }) {} }
