export type CredentialAuthenticationResult =
  | {
      authenticated: true
      userId: string
    }
  | {
      authenticated: false
      auditUserId?: string
    }

export interface AuthStrategyPort<T = unknown> {
  getType(): string
  authenticate(dto: T): Promise<CredentialAuthenticationResult>
}
