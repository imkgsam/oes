import { Allow } from 'class-validator'
import {
  CrmAccountProfileItemDraft,
  CrmLeadIdentifierRecord
} from '../../domain/models/crm-records'

export interface CheckLeadDuplicateQueryProps {
  tenantId: string
  operatorAccountId: string
  displayName?: string | null
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
}

/** CheckLeadDuplicateQuery carries CRM-only evidence for lead duplicate detection. */
export class CheckLeadDuplicateQuery {
  @Allow()
  readonly props: CheckLeadDuplicateQueryProps

  constructor(props: CheckLeadDuplicateQueryProps) {
    this.props = props
  }
}
