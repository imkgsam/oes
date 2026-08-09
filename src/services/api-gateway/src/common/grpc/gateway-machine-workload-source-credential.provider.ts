import { AsyncLocalTransportPrivateSourceCredentialAccessor, TransportPrivateSourceCredentialIssuer } from '@oes/common/authorization'
import { GatewayAuthMachineWorkloadSourceCredentialClient } from './gateway-auth-machine-workload-source-credential.client'

/** GatewayMachineWorkloadSourceCredentialProvider scopes one opaque MACHINE root per Runtime request. */
export class GatewayMachineWorkloadSourceCredentialProvider {
  constructor(private readonly client: GatewayAuthMachineWorkloadSourceCredentialClient, private readonly issuer = new TransportPrivateSourceCredentialIssuer(), private readonly accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()) {}
  async run<T>(callback: () => Promise<T>): Promise<T> { const raw = await this.client.issue(); const handle = this.issuer.issueVerifiedMachineOrDelegationCredential(raw); return this.accessor.run(handle, callback) }
}
