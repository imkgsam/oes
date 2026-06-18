import { ListAccountContactAssetsHandler } from '../../src/application/queries/contact/list-account-contact-assets.handler'
import { ListAccountContactAssetsQuery } from '../../src/application/queries/contact/list-account-contact-assets.query'
import { createAccountContactAssetRepositoryMock, createContactAssetFixture } from '../helpers/identity-fixtures'

describe('ListAccountContactAssetsHandler', () => {
  it('lists account Contact Assets through the unified account-scoped query', async () => {
    const repository = createAccountContactAssetRepositoryMock()
    const assets = [
      createContactAssetFixture({
        id: 'asset-phone',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        type: 'WORK_PHONE',
        ownership: 'COMPANY_CONTROLLED',
        status: 'ACTIVE'
      })
    ]
    repository.listByAccountContactAssetFilter.mockResolvedValue(assets)

    const handler = new ListAccountContactAssetsHandler(repository)
    const result = await handler.execute(
      new ListAccountContactAssetsQuery({
        tenantId: 'tenant-1',
        accountId: 'account-1',
        employeeId: 'employee-1',
        types: ['WORK_PHONE', 'WECHAT'],
        statuses: ['ACTIVE'],
        ownership: ['COMPANY_CONTROLLED']
      })
    )

    expect(repository.listByAccountContactAssetFilter).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      accountId: 'account-1',
      employeeId: 'employee-1',
      types: ['WORK_PHONE', 'WECHAT'],
      statuses: ['ACTIVE'],
      ownership: ['COMPANY_CONTROLLED']
    })
    expect(result).toEqual([
      {
        id: 'asset-phone',
        tenantId: 'tenant-1',
        accountId: 'account-1',
        userId: null,
        employeeId: 'employee-1',
        type: 'WORK_PHONE',
        provider: null,
        value: 'user@corp.com',
        displayName: null,
        ownership: 'COMPANY_CONTROLLED',
        usage: ['WORK_CONTACT'],
        status: 'ACTIVE',
        isPrimary: false,
        assignedAt: new Date('2026-03-24T00:00:00.000Z'),
        releasedAt: null
      }
    ])
  })
})
