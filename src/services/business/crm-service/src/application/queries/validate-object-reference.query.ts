import { Allow } from 'class-validator'

export type CrmObjectReferenceCapabilityInput = 'READ' | 'CREATE_ANNOTATION' | 'MUTATE_ANNOTATION'

/** ValidateCrmObjectReferenceQuery carries one CRM object reference validation request. */
export class ValidateCrmObjectReferenceQuery {
  @Allow()
  readonly tenantId: string

  @Allow()
  readonly operatorId: string

  @Allow()
  readonly objectType: string

  @Allow()
  readonly objectId: string

  @Allow()
  readonly requestedCapability: CrmObjectReferenceCapabilityInput

  constructor(input: {
    tenantId: string
    operatorId: string
    objectType: string
    objectId: string
    requestedCapability: CrmObjectReferenceCapabilityInput
  }) {
    this.tenantId = input.tenantId
    this.operatorId = input.operatorId
    this.objectType = input.objectType
    this.objectId = input.objectId
    this.requestedCapability = input.requestedCapability
  }
}
