export interface InternalCallMetadataInput {
  callerServiceName: string
  requestId?: string
  traceId?: string
}

export interface OperatorScopedContextInput {
  operatorId: string
  operatorType: string
  tenantId?: string
  orgId?: string
  operatorRoles?: string[]
  requestId?: string
  traceId?: string
}

export interface OperatorScopedMetadataInput extends InternalCallMetadataInput {
  operatorContext: OperatorScopedContextInput
}
