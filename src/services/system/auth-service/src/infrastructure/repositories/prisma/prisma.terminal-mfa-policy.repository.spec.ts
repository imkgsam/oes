import { MfaType } from '../../../common/constants'
import { TerminalMfaPolicyEntity } from '../../../domain/entities/terminal-mfa-policy.entity'
import { PrismaTerminalMfaPolicyRepository } from './prisma.terminal-mfa-policy.repository'

describe('PrismaTerminalMfaPolicyRepository', () => {
  it('returns null when a platform terminal MFA default record is missing', async () => {
    const prisma = {
      platformTerminalMfaPolicy: {
        findUnique: jest.fn().mockResolvedValue(null)
      }
    } as any
    const repository = new PrismaTerminalMfaPolicyRepository(prisma)

    const policy = await repository.findPlatformDefaultByTerminal('WEB')

    expect(prisma.platformTerminalMfaPolicy.findUnique).toHaveBeenCalledWith({
      where: { terminal: 'WEB' }
    })
    expect(policy).toBeNull()
  })

  it('returns null when a tenant terminal MFA override record is missing', async () => {
    const prisma = {
      tenantTerminalMfaPolicy: {
        findUnique: jest.fn().mockResolvedValue(null)
      }
    } as any
    const repository = new PrismaTerminalMfaPolicyRepository(prisma)

    const policy = await repository.findTenantOverride('tenant-1', 'WEB')

    expect(prisma.tenantTerminalMfaPolicy.findUnique).toHaveBeenCalledWith({
      where: {
        tenantId_terminal: {
          tenantId: 'tenant-1',
          terminal: 'WEB'
        }
      }
    })
    expect(policy).toBeNull()
  })

  it('loads a tenant terminal MFA override without reading platform defaults', async () => {
    const prisma = {
      tenantTerminalMfaPolicy: {
        findUnique: jest.fn().mockResolvedValue({
          tenantId: 'tenant-1',
          terminal: 'WEB',
          loginMfaRequired: false,
          newDeviceMfaRequired: false,
          allowedFactors: [MfaType.SMS_OTP],
          factorPriority: [MfaType.SMS_OTP]
        })
      }
    } as any
    const repository = new PrismaTerminalMfaPolicyRepository(prisma)

    const policy = await repository.findTenantOverride('tenant-1', 'WEB')

    expect(policy?.requiresLoginMfa()).toBe(false)
    expect(policy?.getAllowedFactors()).toEqual([MfaType.SMS_OTP])
  })

  it('saves platform default and tenant override policies through Prisma JSON arrays', async () => {
    const prisma = {
      platformTerminalMfaPolicy: {
        upsert: jest.fn().mockResolvedValue({
          terminal: 'PDA',
          loginMfaRequired: false,
          newDeviceMfaRequired: false,
          allowedFactors: [MfaType.EMAIL_OTP],
          factorPriority: [MfaType.EMAIL_OTP]
        })
      },
      tenantTerminalMfaPolicy: {
        upsert: jest.fn().mockResolvedValue({
          tenantId: 'tenant-1',
          terminal: 'PDA',
          loginMfaRequired: true,
          newDeviceMfaRequired: false,
          allowedFactors: [MfaType.TOTP],
          factorPriority: [MfaType.TOTP]
        })
      }
    } as any
    const repository = new PrismaTerminalMfaPolicyRepository(prisma)

    await repository.savePlatformDefault(
      new TerminalMfaPolicyEntity({
        terminal: 'PDA',
        loginMfaRequired: false,
        newDeviceMfaRequired: false,
        allowedFactors: [MfaType.EMAIL_OTP],
        factorPriority: [MfaType.EMAIL_OTP]
      }),
      'operator-1'
    )
    await repository.saveTenantOverride(
      TerminalMfaPolicyEntity.tenantOverride('tenant-1', 'PDA', {
        loginMfaRequired: true,
        newDeviceMfaRequired: false,
        allowedFactors: [MfaType.TOTP],
        factorPriority: [MfaType.TOTP]
      }),
      'operator-2'
    )

    expect(prisma.platformTerminalMfaPolicy.upsert).toHaveBeenCalledWith({
      where: { terminal: 'PDA' },
      update: {
        loginMfaRequired: false,
        newDeviceMfaRequired: false,
        allowedFactors: [MfaType.EMAIL_OTP],
        factorPriority: [MfaType.EMAIL_OTP],
        updatedBy: 'operator-1'
      },
      create: {
        terminal: 'PDA',
        loginMfaRequired: false,
        newDeviceMfaRequired: false,
        allowedFactors: [MfaType.EMAIL_OTP],
        factorPriority: [MfaType.EMAIL_OTP],
        updatedBy: 'operator-1'
      }
    })
    expect(prisma.tenantTerminalMfaPolicy.upsert).toHaveBeenCalledWith({
      where: {
        tenantId_terminal: {
          tenantId: 'tenant-1',
          terminal: 'PDA'
        }
      },
      update: {
        loginMfaRequired: true,
        newDeviceMfaRequired: false,
        allowedFactors: [MfaType.TOTP],
        factorPriority: [MfaType.TOTP],
        updatedBy: 'operator-2'
      },
      create: {
        tenantId: 'tenant-1',
        terminal: 'PDA',
        loginMfaRequired: true,
        newDeviceMfaRequired: false,
        allowedFactors: [MfaType.TOTP],
        factorPriority: [MfaType.TOTP],
        updatedBy: 'operator-2'
      }
    })
  })
})
