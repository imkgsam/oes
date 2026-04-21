import { RequirePasswordSetupCommand } from './require-password-setup.command'
import { RequirePasswordSetupHandler } from './require-password-setup.handler'

describe('RequirePasswordSetupHandler', () => {
  it('marks password setup required without accepting a plaintext password', async () => {
    const requirementRepository = {
      requireSetup: jest.fn().mockResolvedValue({})
    }
    const audit = { emitPasswordSetupRequired: jest.fn() }
    const handler = new RequirePasswordSetupHandler(requirementRepository as any, audit as any)

    const result = await handler.execute(
      new RequirePasswordSetupCommand({
        reason: '管理员要求重设密码',
        requiredBy: 'admin-1',
        userId: 'user-1'
      })
    )

    expect(result).toEqual({ success: true, passwordSetupRequired: true })
    expect(requirementRepository.requireSetup).toHaveBeenCalledWith({
      reason: 'ADMIN_RESET',
      requiredBy: 'admin-1',
      userId: 'user-1'
    })
    expect(audit.emitPasswordSetupRequired).toHaveBeenCalledWith(
      'admin-1',
      'user-1',
      '管理员要求重设密码'
    )
  })
})
