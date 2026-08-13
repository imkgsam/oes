import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredentialIssuer
} from '@oes/common/authorization'
import { SrmPartyMachineSourceCredentialClient } from './srm-party-machine-source-credential.client'

export class SrmPartyMachineSourceCredentialProvider {
  constructor(
    private readonly client: SrmPartyMachineSourceCredentialClient,
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
