import { Type } from 'class-transformer'
import { IsArray, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator'
import { ContactActionTargetRefQueryInput } from './resolve-contact-action-targets.query'

/** Carries only card-derived owner selectors and configured action references. */
export class ResolvePublicBusinessCardIdentityQuery {
  @IsString()
  @IsNotEmpty()
  readonly tenantId: string

  @IsUUID()
  readonly employeeId: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactActionTargetRefQueryInput)
  readonly targetRefs: ContactActionTargetRefQueryInput[]

  constructor(input: {
    tenantId: string
    employeeId: string
    targetRefs: Array<{
      contactActionType: string
      targetRefType: string
      targetRefId?: string | null
    }>
  }) {
    this.tenantId = input.tenantId
    this.employeeId = input.employeeId
    this.targetRefs = input.targetRefs.map((ref) => new ContactActionTargetRefQueryInput(ref))
  }
}
