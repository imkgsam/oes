import { CheckResourceService } from '../../src/application/authorization'
import { SetAccountEnabledCommand } from '../../src/application/commands/account/set-account-enabled.command'
import { SetAccountEnabledHandler } from '../../src/application/commands/account/set-account-enabled.handler'
import {
  createAccountRepositoryMock,
  createAccountSummaryFixture
} from '../helpers/identity-fixtures'

describe('SetAccountEnabledHandler', () => {
  it('updates one tenant account enabled state after tenant-boundary checks', async () => {
    const accountRepository = createAccountRepositoryMock()
    accountRepository.findById.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'account-1',
        tenantId: 'tenant-a',
        scopeLevel: 'TENANT',
        isEnabled: true
      })
    )
    accountRepository.setEnabled.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'account-1',
        tenantId: 'tenant-a',
        scopeLevel: 'TENANT',
        isEnabled: false
      })
    )

    const handler = new SetAccountEnabledHandler(accountRepository, new CheckResourceService())

    await expect(
      handler.execute(
        new SetAccountEnabledCommand('account-1', false, 'operator-1', {
          operatorId: 'operator-1',
          tenantId: 'tenant-a'
        } as any)
      )
    ).resolves.toMatchObject({
      id: 'account-1',
      isEnabled: false
    })

    expect(accountRepository.setEnabled).toHaveBeenCalledWith('account-1', false)
  })
})
