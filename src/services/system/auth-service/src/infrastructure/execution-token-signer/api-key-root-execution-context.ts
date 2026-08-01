import type {
  ExchangeExecutionTokenInput,
  TrustedExecutionContext,
  VerifiedExecutionWorkload
} from '../../application/services/execution-token-exchange.service'

const SYSTEM_TENANT_ID = 'SYSTEM'

const ROOT_MACHINE_POLICIES = Object.freeze([
  Object.freeze({
    subject: 'api-gateway',
    workloadSuffix: '/api-gateway',
    permissionCodes: Object.freeze(['auth.internal.external_api_key.exchange'])
  }),
  Object.freeze({
    subject: 'auth-service',
    workloadSuffix: '/auth-service',
    permissionCodes: Object.freeze([
      'identity.internal.integration_machine.resolve',
      'permission.internal.external_machine.snapshot.resolve'
    ])
  })
])

/** Resolves the frozen API-KEY root MACHINE execution context without trusting operator metadata. */
export function resolveApiKeyRootExecutionContext(
  workloadIdentity: VerifiedExecutionWorkload,
  request: Pick<ExchangeExecutionTokenInput, 'requestedPermissionCodes'>
): TrustedExecutionContext | undefined {
  const policy = ROOT_MACHINE_POLICIES.find(
    (candidate) =>
      workloadIdentity.spiffeId.endsWith(candidate.workloadSuffix) &&
      request.requestedPermissionCodes.length > 0 &&
      request.requestedPermissionCodes.every((code) => candidate.permissionCodes.includes(code))
  )
  if (!policy) {
    return undefined
  }

  return Object.freeze({
    subject: policy.subject,
    principalType: 'MACHINE',
    tenantId: SYSTEM_TENANT_ID,
    permissionCodes: policy.permissionCodes
  })
}
