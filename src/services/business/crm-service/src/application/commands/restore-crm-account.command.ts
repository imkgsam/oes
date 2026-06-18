import { Allow } from 'class-validator'

export interface RestoreCrmAccountCommandProps {
  tenantId: string
  crmAccountId: string
  operatorAccountId: string
}

/** RestoreCrmAccountCommand requests reactivation of one archived CRM P1 account. */
export class RestoreCrmAccountCommand {
  @Allow()
  readonly props: RestoreCrmAccountCommandProps

  constructor(props: RestoreCrmAccountCommandProps) {
    this.props = props
  }
}
