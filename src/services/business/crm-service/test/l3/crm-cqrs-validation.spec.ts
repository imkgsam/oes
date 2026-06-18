import { validate } from 'class-validator'
import { ConvertLeadToProspectCustomerCommand } from '../../src/application/commands/convert-lead-to-prospect-customer.command'
import { CreateLeadCommand } from '../../src/application/commands/create-lead.command'
import { CheckLeadDuplicateQuery } from '../../src/application/queries/check-lead-duplicate.query'
import { GetCrmAccountQuery } from '../../src/application/queries/get-crm-account.query'
import { ListCrmAccountsQuery } from '../../src/application/queries/list-crm-accounts.query'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecordStatus,
  CrmAccountTypeHint,
  CrmPriority,
  CrmSourceType
} from '../../src/domain/models/crm-records'

describe('crm-service cqrs validation L3', () => {
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
