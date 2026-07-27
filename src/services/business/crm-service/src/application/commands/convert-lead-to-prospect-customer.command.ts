import { Allow } from 'class-validator'

export interface ConvertLeadToProspectCustomerCommandProps {
  tenantId: string
  crmAccountId: string
  operatorAccountId: string
  allowOwnerlessConversion?: boolean
  legalName?: string | null
}

/** ConvertLeadToProspectCustomerCommand requests formalization of one active CRM lead. */
export class ConvertLeadToProspectCustomerCommand {
  @Allow()
  readonly props: ConvertLeadToProspectCustomerCommandProps

  constructor(props: ConvertLeadToProspectCustomerCommandProps) {
    this.props = props
  }
}
