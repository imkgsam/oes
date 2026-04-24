import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { AccountAvatarUploadUseCase } from './account-avatar-upload.use-case'

describe('AccountAvatarUploadUseCase', () => {
  it('uploads one avatar file for the current authenticated account', async () => {
    const assetAdapter = {
      uploadAccountAvatar: jest.fn().mockResolvedValue({
        asset: {
          assetId: 'asset-1',
          publicUrl: 'http://localhost:9000/oes-assets/avatar/tenant-1/account-1/avatar.webp',
          mimeType: 'image/webp',
          size: '128',
          status: 'PENDING_BIND'
        }
      })
    }
    const useCase = new AccountAvatarUploadUseCase(assetAdapter as any)

    await expect(
      useCase.execute(
        {
          buffer: Buffer.from('avatar'),
          mimetype: 'image/webp',
          originalname: 'avatar.webp',
          size: 128
        },
        {
          user: {
            aid: 'account-1',
            sub: 'user-1',
            tid: 'tenant-1'
          }
        } as any
      )
    ).resolves.toEqual({
      avatarAsset: {
        assetId: 'asset-1',
        publicUrl: 'http://localhost:9000/oes-assets/avatar/tenant-1/account-1/avatar.webp',
        mimeType: 'image/webp',
        size: 128,
        status: 'PENDING_BIND'
      }
    })

    expect(assetAdapter.uploadAccountAvatar).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        contentType: 'image/webp',
        file: Buffer.from('avatar'),
        fileName: 'avatar.webp',
        operatorId: 'account-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1'
      },
      expect.objectContaining({
        user: expect.objectContaining({
          aid: 'account-1',
          tid: 'tenant-1'
        })
      })
    )
  })

  it('rejects upload when current account context is missing', async () => {
    const useCase = new AccountAvatarUploadUseCase({ uploadAccountAvatar: jest.fn() } as any)

    await expect(
      useCase.execute(
        {
          buffer: Buffer.from('avatar'),
          mimetype: 'image/webp',
          originalname: 'avatar.webp',
          size: 128
        },
        {
          user: { sub: 'user-1' }
        } as any
      )
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('uploads one avatar file for a system-scope current account', async () => {
    const assetAdapter = {
      uploadAccountAvatar: jest.fn().mockResolvedValue({
        asset: {
          assetId: 'asset-system-1',
          publicUrl: 'http://localhost:9000/oes-assets/avatar/system/account-1/avatar.webp',
          mimeType: 'image/webp',
          size: '128',
          status: 'PENDING_BIND'
        }
      })
    }
    const useCase = new AccountAvatarUploadUseCase(assetAdapter as any)

    await expect(
      useCase.execute(
        {
          buffer: Buffer.from('avatar'),
          mimetype: 'image/webp',
          originalname: 'avatar.webp',
          size: 128
        },
        {
          user: {
            aid: 'account-1',
            sub: 'user-1',
            scopeLevel: 'SYSTEM'
          }
        } as any
      )
    ).resolves.toEqual({
      avatarAsset: {
        assetId: 'asset-system-1',
        publicUrl: 'http://localhost:9000/oes-assets/avatar/system/account-1/avatar.webp',
        mimeType: 'image/webp',
        size: 128,
        status: 'PENDING_BIND'
      }
    })

    expect(assetAdapter.uploadAccountAvatar).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        contentType: 'image/webp',
        file: Buffer.from('avatar'),
        fileName: 'avatar.webp',
        operatorId: 'account-1',
        scopeLevel: 'SYSTEM',
        tenantId: undefined
      },
      expect.objectContaining({
        user: expect.objectContaining({
          aid: 'account-1',
          scopeLevel: 'SYSTEM'
        })
      })
    )
  })

  it('rejects upload when no file is provided', async () => {
    const useCase = new AccountAvatarUploadUseCase({ uploadAccountAvatar: jest.fn() } as any)

    await expect(
      useCase.execute(undefined, {
        user: { aid: 'account-1', sub: 'user-1', tid: 'tenant-1' }
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
