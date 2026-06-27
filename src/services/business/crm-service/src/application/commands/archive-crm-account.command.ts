import { Allow, IsEnum, IsString } from 'class-validator'
import { CrmArchiveReason } from '../../domain/models/crm-records'

export interface ArchiveCrmAccountCommandProps {
  tenantId: string
  crmAccountId: string
  operatorAccountId: string
  archiveReason: CrmArchiveReason
}

/** ArchiveCrmAccountCommand requests archiving one active Lead or Prospect Customer with a CRM-owned reason. */
export class ArchiveCrmAccountCommand {
  @Allow()
  readonly props: ArchiveCrmAccountCommandProps

  @IsString()
  readonly tenantId: string

  @IsString()
  readonly crmAccountId: string

  @IsEnum(CrmArchiveReason)
  readonly archiveReason: CrmArchiveReason

  constructor(props: ArchiveCrmAccountCommandProps) {
    this.props = props
    this.tenantId = props.tenantId
    this.crmAccountId = props.crmAccountId
    this.archiveReason = props.archiveReason
  }
}
