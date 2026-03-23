export interface InternalServicePrincipal {
  serviceName: string
}

export interface InternalServiceAuthenticationResult {
  authenticated: boolean
  principal?: InternalServicePrincipal
  reason?: string
}
