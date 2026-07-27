import { Allow } from 'class-validator'
import {
  CrmAccountTypeHint,
  CrmAccountProfileItemDraft,
  CrmLeadIdentifierRecord,
  CrmPriority
} from '../../domain/models/crm-records'
import { CreateLeadSourceInput } from './create-lead.command'

export interface CreateDraftLeadCommandProps {
  tenantId: string
  operatorAccountId: string
  displayName: string
  partyTypeHint: CrmAccountTypeHint
  leadLegalName?: string | null
  leadCompanyName?: string | null
  leadPersonName?: string | null
  leadDomain?: string | null
  leadEmail?: string | null
  leadPhone?: string | null
  leadWhatsapp?: string | null
  leadCountry?: string | null
  leadIdentifiers?: CrmLeadIdentifierRecord[]
  profileItems?: CrmAccountProfileItemDraft[]
  priority: CrmPriority
  nextFollowUpAt?: Date | null
  source?: CreateLeadSourceInput | null
}

/** CreateDraftLeadCommand captures an unfinished CRM lead without entering the active lead workspace. */
export class CreateDraftLeadCommand {
  @Allow()
  readonly props: CreateDraftLeadCommandProps

  constructor(props: CreateDraftLeadCommandProps) {
    this.props = props
  }
}
