/** Validates the strict claim profile of an Auth-signed Gateway-only external access token. */
export function validateExternalAccessClaims(claims: any, issuer: string): { machineId: string; tenantId: string; credentialId: string; scope: string[] } {
  const scope = typeof claims?.scope === 'string' ? claims.scope.split(' ').filter(Boolean) : []
  if (claims?.iss !== issuer || claims?.aud !== 'api-gateway' || !claims?.sub || !claims?.tenant_id || !claims?.credential_id || !claims?.authz_version || !scope.length || claims?.cnf || claims?.principal_type || scope.some((code: string) => code.includes('.internal.'))) throw new Error('EXTERNAL_API_ACCESS_DENIED')
  return { machineId: claims.sub, tenantId: claims.tenant_id, credentialId: claims.credential_id, scope: [...new Set(scope as string[])].sort() }
}
