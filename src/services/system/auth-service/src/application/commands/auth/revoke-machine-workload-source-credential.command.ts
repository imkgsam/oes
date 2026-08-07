/** Requests one idempotent management revocation with an allowlisted reason. */
export class RevokeMachineWorkloadSourceCredentialCommand { constructor(public readonly input: { credentialId: string; reasonCode: string; operatorId?: string }) {} }
