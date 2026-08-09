import { IQuery } from '@nestjs/cqrs'
import { PrincipalAuthorizationInput } from '../../../domain/authorization/permission-decision.types'
import { PermissionDecisionCallerContext } from '../../authorization/permission-decision-caller-context'

/** Carries one protected principal issuance decision with verified caller evidence. */
export class ResolvePrincipalAuthorizationQuery implements IQuery {
  constructor(
    public readonly input: PrincipalAuthorizationInput,
    public readonly caller: PermissionDecisionCallerContext
  ) {}
}
