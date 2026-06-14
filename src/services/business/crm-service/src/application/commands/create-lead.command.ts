import { Allow } from 'class-validator'
import {
  CrmAccountTypeHint,
  CrmLeadIdentifierRecord,
  CrmPriority,
  CrmSourceType
} from '../../domain/models/crm-records'

export interface CreateLeadSourceInput {
  sourceType: CrmSourceType
  sourceName?: string | null
  capturedAt?: Date | null
  capturedByAccountId?: string | null
  externalReference?: string | null
  rawPayload?: Record<string, unknown> | null
  note?: string | null
}

export interface CreateLeadCommandProps {
  tenantId: string
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
  ownerAccountId?: string | null
  priority: CrmPriority
  nextFollowUpAt?: Date | null
  duplicateWarningAcknowledged?: boolean
  source: CreateLeadSourceInput
}

/** CreateLeadCommand carries the minimum data required to submit an active CRM lead. */
export class CreateLeadCommand {
  @Allow()
  readonly props: CreateLeadCommandProps

  constructor(props: CreateLeadCommandProps) {
    this.props = props
  }
}
