import { IQuery } from '@nestjs/cqrs'
import { Allow } from 'class-validator'
import { PrincipalAuthorizationInput } from '../../../domain/authorization/permission-decision.types'
import { PermissionDecisionCallerContext } from '../../authorization/permission-decision-caller-context'

/** Carries one protected principal issuance decision with verified caller evidence. */
export class ResolvePrincipalAuthorizationQuery implements IQuery {
  @Allow()
  public readonly input: PrincipalAuthorizationInput

  @Allow()
  public readonly caller: PermissionDecisionCallerContext

  constructor(input: PrincipalAuthorizationInput, caller: PermissionDecisionCallerContext) {
    this.input = input
    this.caller = caller
  }
}
