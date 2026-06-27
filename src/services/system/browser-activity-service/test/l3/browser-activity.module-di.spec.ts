import { Test } from '@nestjs/testing'

import { PrismaBrowserActivityApplication } from '../../src/infrastructure/prisma/prisma-browser-activity-application'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

// Verifies Nest can inject PrismaService into the Prisma-backed browser activity application provider.
describe('browser-activity-service module DI', () => {
  it('resolves PrismaBrowserActivityApplication with an injected PrismaService dependency', async () => {
    const prisma = {
      browserActivityPolicy: {
        upsert: jest.fn().mockResolvedValue({
          aggregateRetentionDays: 365,
          enabled: true,
          rawRetentionDays: 90
        })
      }
    }
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaBrowserActivityApplication,
        {
          provide: PrismaService,
          useValue: prisma
        }
      ]
    }).compile()

    const application = moduleRef.get(PrismaBrowserActivityApplication)

    await expect(
      application.updatePolicy({
        operator: {
          accountId: 'admin-1',
          terminal: 'WEB'
        },
        policy: {
          aggregateRetentionDays: 365,
          enabled: true,
          rawRetentionDays: 90
        },
        tenantId: 'tenant-1'
      })
    ).resolves.toEqual({
      aggregateRetentionDays: 365,
      enabled: true,
      rawRetentionDays: 90
    })
    expect(prisma.browserActivityPolicy.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1' }
      })
    )
  })
})
