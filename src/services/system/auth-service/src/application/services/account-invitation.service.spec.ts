import { AccountInvitationService } from './account-invitation.service'

describe('AccountInvitationService', () => {
  it('sends SMS when phone is present and falls back to email otherwise', async () => {
    const notificationDispatchPort = {
      sendAccountInvitationEmail: jest.fn().mockResolvedValue({
        accepted: true,
        dispatchId: 'dispatch-email-1'
      }),
      sendAccountInvitationSms: jest.fn().mockResolvedValue({
        accepted: true,
        dispatchId: 'dispatch-sms-1'
      })
    }

    const service = new AccountInvitationService(notificationDispatchPort as any)

    await service.sendInvitation({
      accountId: 'account-1',
      displayName: 'Janny',
      email: 'janny@example.com',
      phone: '13800138000'
    })

    expect(notificationDispatchPort.sendAccountInvitationSms).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-1',
        displayName: 'Janny',
        recipient: '13800138000'
      })
    )
    expect(notificationDispatchPort.sendAccountInvitationEmail).not.toHaveBeenCalled()
  })
})
