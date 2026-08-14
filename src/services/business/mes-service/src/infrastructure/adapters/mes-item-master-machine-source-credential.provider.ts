import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredentialIssuer
} from '@oes/common/authorization'
import { MesItemMasterMachineSourceCredentialClient } from './mes-item-master-machine-source-credential.client'

/** Installs MES's verified source credential only for the duration of one STS exchange. */
export class MesItemMasterMachineSourceCredentialProvider {
  constructor(
    private readonly client: MesItemMasterMachineSourceCredentialClient,
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
