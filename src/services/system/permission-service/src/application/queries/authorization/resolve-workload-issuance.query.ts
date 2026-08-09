import { IQuery } from '@nestjs/cqrs'
import { WorkloadIssuanceInput } from '../../../domain/authorization/permission-decision.types'
import { PermissionDecisionCallerContext } from '../../authorization/permission-decision-caller-context'

/** Carries one mTLS-only workload bootstrap decision with exact Auth caller evidence. */
export class ResolveWorkloadIssuanceQuery implements IQuery {
  constructor(
    public readonly input: WorkloadIssuanceInput,
    public readonly caller: PermissionDecisionCallerContext
  ) {}
}
