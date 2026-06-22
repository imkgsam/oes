import { Allow } from 'class-validator'
import {
  CrmAccountTypeHint,
  CrmLeadIdentifierRecord,
  CrmPriority
} from '../../domain/models/crm-records'

export interface UpdateDraftLeadCommandProps {
  tenantId: string
  crmAccountId: string
  operatorAccountId: string
  displayName: string
  partyTypeHint: CrmAccountTypeHint
  leadCompanyName?: string | null
  leadPersonName?: string | null
  leadDomain?: string | null
  leadEmail?: string | null
  leadPhone?: string | null
  leadWhatsapp?: string | null
  leadCountry?: string | null
  leadIdentifiers?: CrmLeadIdentifierRecord[]
  priority: CrmPriority
  nextFollowUpAt?: Date | null
}

/** UpdateDraftLeadCommand carries mutable lead fields for a DRAFT + LEAD account. */
export class UpdateDraftLeadCommand {
  @Allow()
  readonly props: UpdateDraftLeadCommandProps

  constructor(props: UpdateDraftLeadCommandProps) {
    this.props = props
  }
}
