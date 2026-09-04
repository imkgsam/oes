import { TerminalLoginFlow } from '@oes/common/auth'
import { TerminalLoginPolicyEntity } from '../../../domain/entities/terminal-login-policy.entity'
import { PrismaTerminalLoginPolicyRepository } from './prisma.terminal-login-policy.repository'

describe('PrismaTerminalLoginPolicyRepository', () => {
  it('returns null when a terminal login policy record is missing', async () => {
    const prisma = {
      terminalLoginPolicy: {
        findUnique: jest.fn().mockResolvedValue(null)
      }
    } as any
    const repository = new PrismaTerminalLoginPolicyRepository(prisma)

    const policy = await repository.findByTerminal('PDA')

    expect(prisma.terminalLoginPolicy.findUnique).toHaveBeenCalledWith({
      where: { terminal: 'PDA' }
    })
    expect(policy).toBeNull()
  })

  it('saves and reloads enabled login flows through Prisma JSON arrays', async () => {
    const prisma = {
      terminalLoginPolicy: {
        findUnique: jest.fn(),
        upsert: jest.fn()
      }
    } as any
    prisma.terminalLoginPolicy.upsert.mockResolvedValue({
      terminal: 'WEB',
      enabledLoginFlows: [TerminalLoginFlow.EmailPassword, TerminalLoginFlow.PhoneOtp]
    })
    prisma.terminalLoginPolicy.findUnique.mockResolvedValue({
      terminal: 'WEB',
      enabledLoginFlows: [TerminalLoginFlow.EmailPassword, TerminalLoginFlow.PhoneOtp]
    })
    const repository = new PrismaTerminalLoginPolicyRepository(prisma)
    const policy = new TerminalLoginPolicyEntity('WEB', [
      TerminalLoginFlow.EmailPassword,
      TerminalLoginFlow.PhoneOtp
    ])

    await repository.save(policy, 'operator-1')
    const reloaded = await repository.findByTerminal('WEB')

    expect(prisma.terminalLoginPolicy.upsert).toHaveBeenCalledWith({
      where: { terminal: 'WEB' },
      update: {
        enabledLoginFlows: [TerminalLoginFlow.EmailPassword, TerminalLoginFlow.PhoneOtp],
        updatedBy: 'operator-1'
      },
      create: {
        terminal: 'WEB',
        enabledLoginFlows: [TerminalLoginFlow.EmailPassword, TerminalLoginFlow.PhoneOtp],
        updatedBy: 'operator-1'
      }
    })
    expect(reloaded?.getEnabledFlows()).toEqual([
      TerminalLoginFlow.EmailPassword,
      TerminalLoginFlow.PhoneOtp
    ])
  })
})
