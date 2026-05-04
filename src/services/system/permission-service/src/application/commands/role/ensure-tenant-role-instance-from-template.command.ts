import { ICommand } from '@nestjs/cqrs'
import { Allow, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

type EnsureTenantRoleInstanceFromTemplateInput = {
  tenantId: string
  templateRoleCode: string
  idempotencyKey: string
  name?: string
  description?: string
  reason?: string
  operatorScope?: OperatorScope
}

/** EnsureTenantRoleInstanceFromTemplateCommand carries one tenant onboarding role-instance ensure request. */
export class EnsureTenantRoleInstanceFromTemplateCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly tenantId: string

  @IsString()
  @IsNotEmpty()
  readonly templateRoleCode: string

  @IsString()
  @IsNotEmpty()
  readonly idempotencyKey: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  readonly name?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly description?: string

  @IsOptional()
  @IsString()
  readonly reason?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(input: EnsureTenantRoleInstanceFromTemplateInput) {
    this.tenantId = input.tenantId
    this.templateRoleCode = input.templateRoleCode
    this.idempotencyKey = input.idempotencyKey
    this.name = input.name
    this.description = input.description
    this.reason = input.reason
    this.operatorScope = input.operatorScope
  }
}
