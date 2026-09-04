import { TerminalLoginFlow } from '@oes/common/auth'
import { TerminalLoginPolicyEntity } from '../../domain/entities/terminal-login-policy.entity'
import { TerminalLoginPolicyService } from './terminal-login-policy.service'

describe('TerminalLoginPolicyService', () => {
  it('rejects disabled PHONE_OTP on WEB before credential validation', async () => {
    const repository = {
      findByTerminal: jest.fn().mockResolvedValue(
        new TerminalLoginPolicyEntity('WEB', [TerminalLoginFlow.EmailPassword])
      ),
      save: jest.fn()
    }
    const service = new TerminalLoginPolicyService(repository as any)

    await expect(
      service.assertFlowAllowed('WEB', TerminalLoginFlow.PhoneOtp)
    ).rejects.toMatchObject({
      definition: {
        code: 'AUTH_TERMINAL_LOGIN_FLOW_DISABLED',
        message: 'Terminal login flow is disabled for this terminal'
      }
    })
  })

  it('accepts enabled EMAIL_PASSWORD on WEB', async () => {
    const repository = {
      findByTerminal: jest.fn().mockResolvedValue(
        new TerminalLoginPolicyEntity('WEB', [TerminalLoginFlow.EmailPassword])
      ),
      save: jest.fn()
    }
    const service = new TerminalLoginPolicyService(repository as any)

    await expect(
      service.assertFlowAllowed('WEB', TerminalLoginFlow.EmailPassword)
    ).resolves.toBeUndefined()
  })

  it('uses platform defaults when a terminal login policy row is absent', async () => {
    const repository = {
      findByTerminal: jest.fn().mockResolvedValue(null),
      save: jest.fn()
    }
    const service = new TerminalLoginPolicyService(repository as any)

    await expect(service.assertFlowAllowed('PDA', TerminalLoginFlow.Password)).resolves.toBeUndefined()
  })

  it('rejects unsupported enabled flow updates', async () => {
    const repository = {
      findByTerminal: jest.fn().mockResolvedValue(new TerminalLoginPolicyEntity('WEB', [])),
      save: jest.fn()
    }
    const service = new TerminalLoginPolicyService(repository as any)

    await expect(
      service.updatePlatformPolicy({
        terminal: 'WEB',
        enabledLoginFlows: [TerminalLoginFlow.EmailPassword, TerminalLoginFlow.Passkey],
        supportedLoginFlows: [TerminalLoginFlow.EmailPassword]
      })
    ).rejects.toMatchObject({
      definition: {
        code: 'AUTH_TERMINAL_LOGIN_FLOW_UNSUPPORTED'
      }
    })
    expect(repository.save).not.toHaveBeenCalled()
  })
})
