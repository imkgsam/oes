import { CommandBus } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { UploadAccountAvatarCommand } from '../../src/application/commands/avatar/upload-account-avatar.command'
import { UploadEmployeeOfficialPhotoCommand } from '../../src/application/commands/avatar/upload-employee-official-photo.command'

describe('avatar command validation', () => {
  it('allows upload command binary file payloads through whitelist validation', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue('ok')
    } as unknown as CommandBus
    const validatingCommandBus = new ValidatingCommandBus(commandBus)

    await expect(
      validatingCommandBus.execute(
        new UploadAccountAvatarCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          accountId: 'account-1',
          operatorId: 'operator-1',
          file: Buffer.from('avatar'),
          fileName: 'avatar.webp',
          contentType: 'image/webp'
        })
      )
    ).resolves.toBe('ok')

    expect(commandBus.execute).toHaveBeenCalledTimes(1)
  })

  it('allows system-scope upload commands without tenantId', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue('ok')
    } as unknown as CommandBus
    const validatingCommandBus = new ValidatingCommandBus(commandBus)

    await expect(
      validatingCommandBus.execute(
        new UploadAccountAvatarCommand({
          scopeLevel: 'SYSTEM',
          tenantId: undefined,
          accountId: 'account-1',
          operatorId: 'operator-1',
          file: Buffer.from('avatar'),
          fileName: 'avatar.webp',
          contentType: 'image/webp'
        })
      )
    ).resolves.toBe('ok')

    expect(commandBus.execute).toHaveBeenCalledTimes(1)
  })

  it('rejects employee official photo upload commands without employeeId', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue('ok')
    } as unknown as CommandBus
    const validatingCommandBus = new ValidatingCommandBus(commandBus)

    await expect(
      validatingCommandBus.execute(
        new UploadEmployeeOfficialPhotoCommand({
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          employeeId: '',
          operatorId: 'operator-1',
          file: Buffer.from('avatar'),
          fileName: 'official.webp',
          contentType: 'image/webp'
        })
      )
    ).rejects.toMatchObject({
      additionalDetails: {
        violations: ['employeeId: employeeId is required']
      }
    })

    expect(commandBus.execute).not.toHaveBeenCalled()
  })
})
