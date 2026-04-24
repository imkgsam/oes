export const AUTH_LOGIN_BOOTSTRAP_PORT = Symbol('AUTH_LOGIN_BOOTSTRAP_PORT')

export interface AuthLoginBootstrapPort {
  bootstrapUserLoginMethods(input: {
    userId: string
    accountId: string
    displayName: string
    email?: string
    phone?: string
    operatorContext?: {
      operatorId: string
      operatorType: string
      tenantId?: string
      orgId?: string
      operatorRoles?: string[]
    }
    requestId?: string
    traceId?: string
  }): Promise<void>
}
