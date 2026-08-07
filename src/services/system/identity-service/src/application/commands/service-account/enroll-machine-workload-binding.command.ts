/** Requests creation of one exact Machine Principal to SPIFFE workload binding. */
export class EnrollMachineWorkloadBindingCommand { constructor(public readonly input: { machinePrincipalId: string; workloadSpiffeId: string; idempotencyKey: string; operatorId?: string }) {} }
