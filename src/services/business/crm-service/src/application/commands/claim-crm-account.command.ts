import { Allow } from 'class-validator'

export interface ClaimCrmAccountCommandProps {
  tenantId: string
  crmAccountId: string
  operatorAccountId: string
}

/** ClaimCrmAccountCommand requests ownership of one ownerless active CRM pool record. */
export class ClaimCrmAccountCommand {
  @Allow()
  readonly props: ClaimCrmAccountCommandProps

  constructor(props: ClaimCrmAccountCommandProps) {
    this.props = props
  }
}
