import { Allow } from 'class-validator'

export interface ReleaseCrmAccountCommandProps {
  tenantId: string
  crmAccountId: string
  operatorAccountId: string
}

/** ReleaseCrmAccountCommand requests returning one owned active CRM record to the tenant Pool. */
export class ReleaseCrmAccountCommand {
  @Allow()
  readonly props: ReleaseCrmAccountCommandProps

  constructor(props: ReleaseCrmAccountCommandProps) {
    this.props = props
  }
}
