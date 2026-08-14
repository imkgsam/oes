import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredentialIssuer
} from '@oes/common/authorization'
import { ProcurementItemMasterMachineSourceCredentialClient } from './procurement-item-master-machine-source-credential.client'

/** Installs PROCUREMENT's verified source credential only for the duration of one STS exchange. */
export class ProcurementItemMasterMachineSourceCredentialProvider {
  constructor(
    private readonly client: ProcurementItemMasterMachineSourceCredentialClient,
    private readonly issuer = new TransportPrivateSourceCredentialIssuer(),
    readonly accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
  ) {}

  async run<T>(callback: () => Promise<T>): Promise<T> {
    const sourceCredential = await this.client.issue()
    return this.accessor.run(
      this.issuer.issueVerifiedMachineOrDelegationCredential(sourceCredential),
      callback
    )
  }
}
