/** Requests irreversible disablement of one binding at its exact expected version. */
export class DisableMachineWorkloadBindingCommand { constructor(public readonly input: { bindingId: string; expectedVersion: bigint; reasonCode: string; operatorId?: string }) {} }
