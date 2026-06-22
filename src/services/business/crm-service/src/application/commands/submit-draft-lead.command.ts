import { Allow } from 'class-validator'
import { CrmLeadAssignmentIntent } from '../../domain/models/crm-records'
import { CreateLeadSourceInput } from './create-lead.command'

export interface SubmitDraftLeadCommandProps {
  tenantId: string
  crmAccountId: string
  operatorAccountId: string
  assignmentIntent?: CrmLeadAssignmentIntent
  duplicateWarningAcknowledged?: boolean
  claimForCurrentUser?: boolean
  source?: CreateLeadSourceInput | null
}

/** SubmitDraftLeadCommand promotes one DRAFT + LEAD into the formal ACTIVE + LEAD workspace. */
export class SubmitDraftLeadCommand {
  @Allow()
  readonly props: SubmitDraftLeadCommandProps

  constructor(props: SubmitDraftLeadCommandProps) {
    this.props = props
  }
}
