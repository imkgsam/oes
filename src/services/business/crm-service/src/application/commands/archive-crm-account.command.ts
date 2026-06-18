import { Allow } from 'class-validator'

export interface ArchiveCrmAccountCommandProps {
  tenantId: string
  crmAccountId: string
  operatorAccountId: string
}

/** ArchiveCrmAccountCommand requests soft archival of one CRM P1 lead or prospect customer. */
export class ArchiveCrmAccountCommand {
  @Allow()
  readonly props: ArchiveCrmAccountCommandProps

  constructor(props: ArchiveCrmAccountCommandProps) {
    this.props = props
  }
}
