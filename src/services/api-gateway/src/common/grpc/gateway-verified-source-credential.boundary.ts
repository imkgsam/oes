import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredentialIssuer
} from '@oes/common/authorization'

/** Resolves source credentials only after Gateway's owning verifier has established their validity. */
export interface GatewayVerifiedSourceCredentialProvider {
  requireVerifiedSessionAccessCredential(): string
  requireVerifiedExternalAccessCredential(): string
}

/** Seeds Common's private carrier only after Gateway's session or external verifier has succeeded. */
export class GatewayVerifiedSourceCredentialBoundary {
  constructor(
    private readonly verifiedCredentialProvider: GatewayVerifiedSourceCredentialProvider,
    private readonly issuer: TransportPrivateSourceCredentialIssuer,
    private readonly accessor: AsyncLocalTransportPrivateSourceCredentialAccessor
  ) {}

  /** Runs one downstream operation with an Auth-verifiable verified session/access credential. */
  runWithVerifiedSessionAccessCredential<T>(callback: () => T): T {
    return this.accessor.run(
      this.issuer.issueVerifiedSessionAccessCredential(
        this.verifiedCredentialProvider.requireVerifiedSessionAccessCredential()
      ),
      callback
    )
  }

  /** Runs one downstream operation with a verified Gateway-only external access credential. */
  runWithVerifiedExternalAccessCredential<T>(callback: () => T): T {
    return this.accessor.run(
      this.issuer.issueVerifiedExternalAccessCredential(
        this.verifiedCredentialProvider.requireVerifiedExternalAccessCredential()
      ),
      callback
    )
  }
}
