import { IQuery } from '@nestjs/cqrs'
import { DelegatedAuthorizationInput } from '../../../domain/authorization/permission-decision.types'
import { PermissionDecisionCallerContext } from '../../authorization/permission-decision-caller-context'

/** Carries one protected delegated action decision with verified caller evidence. */
export class ResolveDelegatedAuthorizationQuery implements IQuery {
  constructor(
    public readonly input: DelegatedAuthorizationInput,
    public readonly caller: PermissionDecisionCallerContext
  ) {}
}
