import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredentialIssuer
} from '@oes/common/authorization'
import { AuthNotificationMachineSourceCredentialClient } from './auth-notification-machine-source-credential.client'

/** Scopes one opaque Auth MACHINE root to the Common STS carrier without exposing its bearer. */
export class AuthNotificationMachineSourceCredentialProvider {
  constructor(
    private readonly client: AuthNotificationMachineSourceCredentialClient,
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
