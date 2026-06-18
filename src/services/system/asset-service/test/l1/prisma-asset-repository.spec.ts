import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { PrismaAssetRepository } from '../../src/infrastructure/repositories/prisma/prisma.asset.repository'

const baseAssetRecord = {
  id: 'asset-employee-1',
  scopeLevel: 'TENANT',
  tenantId: 'tenant-1',
  ownerAccountId: null,
  ownerEmployeeId: 'employee-1',
  category: 'EMPLOYEE_OFFICIAL_PHOTO',
  storageKey: 'avatar/tenant/tenant-1/employee/employee-1/official/asset-employee-1.webp',
  mimeType: 'image/webp',
  size: BigInt(12),
  checksum: 'checksum',
  publicUrl:
    'http://localhost:9000/oes-assets/avatar/tenant/tenant-1/employee/employee-1/official/asset-employee-1.webp',
  status: 'ACTIVE',
  createdBy: 'operator-1',
  updatedBy: null,
  createdAt: new Date('2026-04-22T00:00:00.000Z'),
  updatedAt: new Date('2026-04-22T00:00:00.000Z')
} as const

describe('PrismaAssetRepository', () => {
  it('activates employee official photos and replaces the previous active photo in one transaction', async () => {
    const nextAssetRecord = {
      ...baseAssetRecord,
      id: 'asset-employee-2',
      status: 'PENDING_BIND',
      storageKey: 'avatar/tenant/tenant-1/employee/employee-1/official/asset-employee-2.webp'
    }
    const activeAssetRecord = {
      ...baseAssetRecord,
      id: 'asset-employee-2',
      status: 'ACTIVE',
      updatedBy: 'admin-1'
    }
    const previousAssetRecord = {
      ...baseAssetRecord,
      id: 'asset-employee-1',
      status: 'ACTIVE'
    }
    const replacedAssetRecord = {
      ...previousAssetRecord,
      status: 'REPLACED',
      updatedBy: 'admin-1'
    }
    const tx = {
      asset: {
        findFirst: jest.fn().mockResolvedValue(previousAssetRecord),
        findUnique: jest.fn().mockResolvedValue(nextAssetRecord),
        update: jest
          .fn()
          .mockResolvedValueOnce(replacedAssetRecord)
          .mockResolvedValueOnce(activeAssetRecord)
      }
    }
    const prisma = {
      $transaction: jest.fn((callback) => callback(tx))
    }
    const repository = new PrismaAssetRepository(prisma as never)

    const result = await repository.activateEmployeeOfficialPhoto({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      newAssetId: 'asset-employee-2',
      previousAssetId: 'asset-employee-1',
      updatedBy: 'admin-1'
    })

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(tx.asset.findFirst).toHaveBeenCalledWith({
      where: {
        scopeLevel: 'TENANT',
        ownerEmployeeId: 'employee-1',
        tenantId: 'tenant-1',
        category: 'EMPLOYEE_OFFICIAL_PHOTO',
        status: 'ACTIVE'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    expect(tx.asset.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'asset-employee-1' },
      data: {
        activeEmployeeOfficialPhotoKey: null,
        status: 'REPLACED',
        updatedBy: 'admin-1'
      }
    })
    expect(tx.asset.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'asset-employee-2' },
      data: {
        activeEmployeeOfficialPhotoKey: 'tenant:tenant-1:employee:employee-1:official-photo',
        status: 'ACTIVE',
        updatedBy: 'admin-1'
      }
    })
    expect(result.activeAsset.id).toBe('asset-employee-2')
    expect(result.replacedAssetId).toBe('asset-employee-1')
  })

  it('rejects stale previous employee official photo ids before status changes inside the transaction', async () => {
    const nextAssetRecord = {
      ...baseAssetRecord,
      id: 'asset-employee-2',
      status: 'PENDING_BIND',
      storageKey: 'avatar/tenant/tenant-1/employee/employee-1/official/asset-employee-2.webp'
    }
    const currentActiveRecord = {
      ...baseAssetRecord,
      id: 'asset-employee-current',
      status: 'ACTIVE'
    }
    const tx = {
      asset: {
        findFirst: jest.fn().mockResolvedValue(currentActiveRecord),
        findUnique: jest.fn().mockResolvedValue(nextAssetRecord),
        update: jest.fn()
      }
    }
    const prisma = {
      $transaction: jest.fn((callback) => callback(tx))
    }
    const repository = new PrismaAssetRepository(prisma as never)

    await expect(
      repository.activateEmployeeOfficialPhoto({
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        newAssetId: 'asset-employee-2',
        previousAssetId: 'asset-employee-stale',
        updatedBy: 'admin-1'
      })
    ).rejects.toMatchObject({
      definition: {
        code: VALIDATION_FAILED.code
      }
    })

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(tx.asset.update).not.toHaveBeenCalled()
  })

  it.each(['REPLACED', 'DELETED', 'ACTIVE'] as const)(
    'rejects %s employee official photo assets before activation status changes',
    async (status) => {
      const nextAssetRecord = {
        ...baseAssetRecord,
        id: 'asset-employee-2',
        status,
        storageKey: 'avatar/tenant/tenant-1/employee/employee-1/official/asset-employee-2.webp'
      }
      const tx = {
        asset: {
          findFirst: jest.fn().mockResolvedValue(null),
          findUnique: jest.fn().mockResolvedValue(nextAssetRecord),
          update: jest.fn()
        }
      }
      const prisma = {
        $transaction: jest.fn((callback) => callback(tx))
      }
      const repository = new PrismaAssetRepository(prisma as never)

      await expect(
        repository.activateEmployeeOfficialPhoto({
          tenantId: 'tenant-1',
          employeeId: 'employee-1',
          newAssetId: 'asset-employee-2',
          updatedBy: 'admin-1'
        })
      ).rejects.toMatchObject({
        definition: {
          code: VALIDATION_FAILED.code
        }
      })

      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
      expect(tx.asset.update).not.toHaveBeenCalled()
    }
  )
})
