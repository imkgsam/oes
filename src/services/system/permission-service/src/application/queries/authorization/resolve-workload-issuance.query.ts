import { IQuery } from '@nestjs/cqrs'
import { WorkloadIssuanceInput } from '../../../domain/authorization/permission-decision.types'
import { PermissionDecisionCallerContext } from '../../authorization/permission-decision-caller-context'
import { Allow } from 'class-validator'

/** Carries one mTLS-only workload bootstrap decision with exact Auth caller evidence. */
export class ResolveWorkloadIssuanceQuery implements IQuery {
  @Allow()
  public readonly input: WorkloadIssuanceInput

  @Allow()
  public readonly caller: PermissionDecisionCallerContext

  constructor(
    input: WorkloadIssuanceInput,
    caller: PermissionDecisionCallerContext
  ) {
    this.input = input
    this.caller = caller
  }
}
