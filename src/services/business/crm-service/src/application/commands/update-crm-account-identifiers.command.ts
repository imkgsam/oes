import { Allow } from 'class-validator'
import { CrmLeadIdentifierRecord } from '../../domain/models/crm-records'

export interface UpdateCrmAccountIdentifiersCommandProps {
  tenantId: string
  crmAccountId: string
  operatorAccountId: string
  leadIdentifiers: CrmLeadIdentifierRecord[]
}

/** UpdateCrmAccountIdentifiersCommand replaces CRM-owned strong identifier evidence for one Lead or Prospect Customer. */
export class UpdateCrmAccountIdentifiersCommand {
  @Allow()
  readonly props: UpdateCrmAccountIdentifiersCommandProps

  constructor(props: UpdateCrmAccountIdentifiersCommandProps) {
    this.props = props
  }
}
