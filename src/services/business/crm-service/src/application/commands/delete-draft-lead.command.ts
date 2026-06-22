import { Allow } from 'class-validator'

export interface DeleteDraftLeadCommandProps {
  tenantId: string
  crmAccountId: string
  operatorAccountId: string
}

/** DeleteDraftLeadCommand requests hard deletion of one unfinished draft lead. */
export class DeleteDraftLeadCommand {
  @Allow()
  readonly props: DeleteDraftLeadCommandProps

  constructor(props: DeleteDraftLeadCommandProps) {
    this.props = props
  }
}
