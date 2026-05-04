import { GrpcMetadataPropagationFactory, GrpcRequestContextStore } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'

/** buildTenantOnboardingMetadata preserves the operator context while tenant-org coordinates owner-service onboarding calls. */
export function buildTenantOnboardingMetadata(
  metadataFactory: GrpcMetadataPropagationFactory,
  requestContextStore: GrpcRequestContextStore
) {
  const current = requestContextStore.getContext()
  const operatorContext = current?.operatorContext
  const requestId = current?.requestId ?? operatorContext?.request_id
  const traceId = current?.traceId ?? operatorContext?.trace_id

  if (operatorContext?.operator_id && operatorContext.operator_type) {
    return metadataFactory.createOperatorScopedMetadata({
      callerServiceName: SERVICE_NAMES.TENANT_ORG,
      requestId,
      traceId,
      operatorContext: {
        operatorId: operatorContext.operator_id,
        operatorType: operatorContext.operator_type,
        tenantId: operatorContext.tenant_id,
        orgId: operatorContext.org_id,
        operatorRoles: operatorContext.operator_roles,
        requestId,
        traceId
      }
    })
  }

  return metadataFactory.createInternalCallMetadata({
    callerServiceName: SERVICE_NAMES.TENANT_ORG,
    requestId,
    traceId
  })
}
