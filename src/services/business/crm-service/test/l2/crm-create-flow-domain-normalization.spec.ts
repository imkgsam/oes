import { CreateLeadCommand } from '../../src/application/commands/create-lead.command'
import { CreateLeadHandler } from '../../src/application/commands/create-lead.handler'
import { CheckLeadDuplicateHandler } from '../../src/application/queries/check-lead-duplicate.handler'
import {
  CrmAccountTypeHint,
  CrmLeadCreateResultType,
  CrmPriority,
  CrmSourceType
} from '../../src/domain/models/crm-records'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaCrmAccountRepository } from '../../src/infrastructure/repositories/prisma/prisma-crm-account.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('CRM create flow InternetDomain normalization L2', () => {
  let prisma: PrismaService
  let accountRepository: PrismaCrmAccountRepository
  let createLeadHandler: CreateLeadHandler
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    accountRepository = new PrismaCrmAccountRepository(prisma)
    createLeadHandler = new CreateLeadHandler(
      accountRepository,
      new CheckLeadDuplicateHandler(accountRepository)
    )
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('CreateLead / should persist canonical leadDomain through the full application-to-repository creation flow', async () => {
    const tenantId = `${prefix}_tenant`

    const result = await createLeadHandler.execute(
      new CreateLeadCommand({
        tenantId,
        operatorAccountId: `${prefix}_sales`,
        displayName: `${prefix} Vintage Tub`,
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        leadCompanyName: `${prefix} Vintage Tub`,
        leadDomain: 'https://www.vintagetub.com/products?id=1',
        leadIdentifiers: [],
        priority: CrmPriority.B,
        source: {
          sourceType: CrmSourceType.WEB_RESEARCH,
          capturedAt: new Date('2026-06-23T00:00:00.000Z'),
          capturedByAccountId: `${prefix}_sales`
        }
      })
    )

    expect(result.resultType).toBe(CrmLeadCreateResultType.CREATED)
    expect(result.account?.leadDomain).toBe('vintagetub.com')

    const persisted = await accountRepository.findAccountById(tenantId, result.account?.id ?? '')
    expect(persisted?.leadDomain).toBe('vintagetub.com')
  })
})
