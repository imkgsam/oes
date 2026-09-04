import { validate } from 'class-validator'
import { ClaimCrmAccountCommand } from '../application/commands/claim-crm-account.command'
import { ConvertLeadToProspectCustomerCommand } from '../application/commands/convert-lead-to-prospect-customer.command'
import { CreateDraftLeadCommand } from '../application/commands/create-draft-lead.command'
import { CreateLeadCommand } from '../application/commands/create-lead.command'
import { DeleteDraftLeadCommand } from '../application/commands/delete-draft-lead.command'
import { SubmitDraftLeadCommand } from '../application/commands/submit-draft-lead.command'
import { UpdateDraftLeadCommand } from '../application/commands/update-draft-lead.command'
import { CheckLeadDuplicateQuery } from '../application/queries/check-lead-duplicate.query'
import { GetCrmAccountQuery } from '../application/queries/get-crm-account.query'
import { ListCrmAccountsQuery } from '../application/queries/list-crm-accounts.query'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecordStatus,
  CrmAccountTypeHint,
  CrmPriority,
  CrmSourceType
} from '../domain/models/crm-records'

describe('crm-service cqrs validation Contract', () => {
  it('commands and queries / should be whitelisted for the validating command and query buses', async () => {
    const cases = [
      new CreateLeadCommand({
        tenantId: 'tenant-1',
        operatorAccountId: 'operator-1',
        displayName: 'Acme Importers',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        leadCompanyName: 'Acme Importers Ltd',
        leadDomain: 'acme.example',
        leadEmail: 'buyer@acme.example',
        leadCountry: 'US',
        ownerAccountId: 'operator-1',
        priority: CrmPriority.A,
        duplicateWarningAcknowledged: false,
        source: {
          sourceType: CrmSourceType.WEB_RESEARCH,
          sourceName: 'Browser research'
        }
      }),
      new ConvertLeadToProspectCustomerCommand({
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1',
        operatorAccountId: 'operator-1'
      }),
      new CreateDraftLeadCommand({
        tenantId: 'tenant-1',
        operatorAccountId: 'operator-1',
        displayName: 'Draft Lead',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        priority: CrmPriority.B
      }),
      new UpdateDraftLeadCommand({
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1',
        operatorAccountId: 'operator-1',
        displayName: 'Draft Lead',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        priority: CrmPriority.B
      }),
      new SubmitDraftLeadCommand({
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1',
        operatorAccountId: 'operator-1',
        claimForCurrentUser: true
      }),
      new DeleteDraftLeadCommand({
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1',
        operatorAccountId: 'operator-1'
      }),
      new ClaimCrmAccountCommand({
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1',
        operatorAccountId: 'operator-1'
      }),
      new CheckLeadDuplicateQuery({
        tenantId: 'tenant-1',
        operatorAccountId: 'operator-1',
        displayName: 'Acme Importers',
        leadDomain: 'acme.example'
      }),
      new ListCrmAccountsQuery({
        tenantId: 'tenant-1',
        keyword: 'acme',
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        recordStatus: CrmAccountRecordStatus.ACTIVE,
        ownerAccountId: 'operator-1',
        page: 1,
        pageSize: 20
      }),
      new GetCrmAccountQuery('tenant-1', 'crm-account-1')
    ]

    for (const value of cases) {
      await expect(
        validate(value as object, {
          whitelist: true,
          forbidNonWhitelisted: true,
          forbidUnknownValues: false,
          skipMissingProperties: false
        })
      ).resolves.toEqual([])
    }
  })
})
