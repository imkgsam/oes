import { Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  Prisma,
  CrmCustomerStatus as PrismaCustomerStatus
} from '../../../../prisma/generated/prisma'
import { CRM_ALREADY_EXISTS } from '../../../common/errors/crm.errors'
import {
  CustomerAccountRecord,
  CustomerStatus,
  PageResult,
  SearchCustomerAccountsInput,
  SearchSelectableCustomersInput,
  SelectableCustomerRecord
} from '../../../domain/models/crm-records'
import { CustomerAccountRepository } from '../../../domain/repositories/customer-account.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaCrmRecordMapper } from './prisma-crm-record.mapper'

/** PrismaCustomerAccountRepository persists CRM account shells and allocates globally unique account numbers in PostgreSQL. */
@Injectable()
export class PrismaCustomerAccountRepository implements CustomerAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextCustomerAccountNo(tenantId: string): Promise<string> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.crmSequenceCounter.upsert({
        where: {
          tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY
        },
        create: {
          tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY,
          nextCustomerAccountNo: 1
        },
        update: {}
      })

      const [globalCounter, highestCounter, persistedCeiling] = await Promise.all([
        client.crmSequenceCounter.findUniqueOrThrow({
          where: {
            tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY
          },
          select: {
            nextCustomerAccountNo: true
          }
        }),
        client.crmSequenceCounter.aggregate({
          _max: {
            nextCustomerAccountNo: true
          }
        }),
        readPersistedCustomerAccountNoCeiling(client)
      ])

      const nextCustomerAccountNo = Math.max(
        globalCounter.nextCustomerAccountNo,
        highestCounter._max.nextCustomerAccountNo ?? 1,
        persistedCeiling + 1
      )

      await client.crmSequenceCounter.updateMany({
        where: {
          tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY,
          nextCustomerAccountNo: {
            lt: nextCustomerAccountNo
          }
        },
        data: {
          nextCustomerAccountNo
        }
      })

      const updated = await client.crmSequenceCounter.update({
        where: {
          tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY
        },
        data: {
          nextCustomerAccountNo: {
            increment: 1
          }
        },
        select: {
          nextCustomerAccountNo: true
        }
      })

      return formatDocumentNo(CUSTOMER_ACCOUNT_NO_PREFIX, updated.nextCustomerAccountNo - 1)
    })
  }

  async findById(tenantId: string, customerAccountId: string): Promise<CustomerAccountRecord | null> {
    const record = await this.prisma.getExecutionClient().customerAccount.findFirst({
      where: {
        tenantId,
        id: customerAccountId
      },
      include: PrismaCrmRecordMapper.customerAccountIncludeValue()
    })

    return record ? PrismaCrmRecordMapper.toCustomerAccount(record) : null
  }

  async findActiveByTenantPartyId(tenantId: string, tenantPartyId: string): Promise<CustomerAccountRecord | null> {
    const record = await this.prisma.getExecutionClient().customerAccount.findFirst({
      where: {
        tenantId,
        status: PrismaCustomerStatus.ACTIVE_CUSTOMER,
        primaryBinding: {
          is: {
            tenantPartyId
          }
        }
      },
      include: PrismaCrmRecordMapper.customerAccountIncludeValue()
    })

    return record ? PrismaCrmRecordMapper.toCustomerAccount(record) : null
  }

  async save(account: CustomerAccountRecord): Promise<CustomerAccountRecord> {
    try {
      return await this.prisma.runInTransaction(async () => {
        const client = this.prisma.getExecutionClient()
        await client.customerAccount.upsert({
          where: {
            id: account.id
          },
          create: {
            id: account.id,
            customerAccountNo: account.customerAccountNo,
            tenantId: account.tenantId,
            displayName: account.displayName,
            status: PrismaCrmRecordMapper.toPersistedCustomerStatus(account.status),
            customerCategory: account.customerCategory ?? null,
            tags: PrismaCrmRecordMapper.toInputJson(account.tags)
          },
          update: {
            customerAccountNo: account.customerAccountNo,
            displayName: account.displayName,
            status: PrismaCrmRecordMapper.toPersistedCustomerStatus(account.status),
            customerCategory: account.customerCategory ?? null,
            tags: PrismaCrmRecordMapper.toInputJson(account.tags)
          }
        })

        if (account.primaryBinding) {
          await client.customerPartyBinding.upsert({
            where: {
              customerAccountId: account.id
            },
            create: {
              id: account.primaryBinding.customerPartyBindingId,
              tenantId: account.primaryBinding.tenantId,
              customerAccountId: account.id,
              tenantPartyId: account.primaryBinding.tenantPartyId,
              bindingStatus: PrismaCrmRecordMapper.toPersistedBindingStatus(account.primaryBinding.bindingStatus),
              partyDisplayName: account.primaryBinding.partyDisplayName ?? null
            },
            update: {
              tenantPartyId: account.primaryBinding.tenantPartyId,
              bindingStatus: PrismaCrmRecordMapper.toPersistedBindingStatus(account.primaryBinding.bindingStatus),
              partyDisplayName: account.primaryBinding.partyDisplayName ?? null
            }
          })
        } else {
          await client.customerPartyBinding.deleteMany({
            where: {
              customerAccountId: account.id
            }
          })
        }

        const saved = await client.customerAccount.findUniqueOrThrow({
          where: {
            id: account.id
          },
          include: PrismaCrmRecordMapper.customerAccountIncludeValue()
        })

        return PrismaCrmRecordMapper.toCustomerAccount(saved)
      })
    } catch (error) {
      if (isTenantPartyBindingUniqueViolation(error, account)) {
        throw ExceptionFactory.application(CRM_ALREADY_EXISTS, {
          reason: 'tenantParty is already bound to another active customer account',
          tenantPartyId: account.primaryBinding?.tenantPartyId,
          customerAccountId: account.id
        })
      }

      if (isCustomerAccountNoUniqueViolation(error)) {
        throw ExceptionFactory.application(CRM_ALREADY_EXISTS, {
          reason: 'customerAccountNo is already occupied by another customer account',
          customerAccountNo: account.customerAccountNo,
          customerAccountId: account.id
        })
      }

      throw error
    }
  }

  async search(input: SearchCustomerAccountsInput): Promise<PageResult<CustomerAccountRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const where = buildSearchWhere(input)

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().customerAccount.count({ where }),
      this.prisma.getExecutionClient().customerAccount.findMany({
        where,
        include: PrismaCrmRecordMapper.customerAccountIncludeValue(),
        orderBy: {
          customerAccountNo: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => PrismaCrmRecordMapper.toCustomerAccount(item)),
      total,
      page,
      pageSize
    }
  }

  async searchSelectable(input: SearchSelectableCustomersInput): Promise<PageResult<SelectableCustomerRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const where: Prisma.CustomerAccountWhereInput = {
      tenantId: input.tenantId,
      status: PrismaCustomerStatus.ACTIVE_CUSTOMER,
      primaryBinding: {
        isNot: null
      },
      OR: input.keyword
        ? [
            {
              customerAccountNo: {
                contains: input.keyword,
                mode: 'insensitive'
              }
            },
            {
              displayName: {
                contains: input.keyword,
                mode: 'insensitive'
              }
            },
            {
              primaryBinding: {
                is: {
                  partyDisplayName: {
                    contains: input.keyword,
                    mode: 'insensitive'
                  }
                }
              }
            }
          ]
        : undefined
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().customerAccount.count({ where }),
      this.prisma.getExecutionClient().customerAccount.findMany({
        where,
        include: PrismaCrmRecordMapper.customerAccountIncludeValue(),
        orderBy: {
          customerAccountNo: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => ({
        customerAccountId: item.id,
        customerAccountNo: item.customerAccountNo,
        displayName: item.displayName,
        status: CustomerStatus.ACTIVE_CUSTOMER,
        primaryTenantPartyId: item.primaryBinding!.tenantPartyId,
        primaryPartyDisplayName: item.primaryBinding!.partyDisplayName ?? null
      })),
      total,
      page,
      pageSize
    }
  }
}

const CUSTOMER_ACCOUNT_NO_PREFIX = 'CA'
const CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY = '__global_customer_account_no__'

/** buildSearchWhere translates the CRM account-directory filters into a Prisma where clause. */
function buildSearchWhere(input: SearchCustomerAccountsInput): Prisma.CustomerAccountWhereInput {
  return {
    tenantId: input.tenantId,
    status: input.status ? PrismaCrmRecordMapper.toPersistedCustomerStatus(input.status) : undefined,
    primaryBinding: input.primaryTenantPartyId
      ? {
          is: {
            tenantPartyId: input.primaryTenantPartyId
          }
        }
      : undefined,
    OR: input.keyword
      ? [
          {
            customerAccountNo: {
              contains: input.keyword,
              mode: 'insensitive'
            }
          },
          {
            displayName: {
              contains: input.keyword,
              mode: 'insensitive'
            }
          },
          {
            primaryBinding: {
              is: {
                partyDisplayName: {
                  contains: input.keyword,
                  mode: 'insensitive'
                }
              }
            }
          }
        ]
      : undefined
  }
}

/** formatDocumentNo converts one numeric sequence into the frozen CRM account-number summary format. */
function formatDocumentNo(prefix: string, value: number): string {
  return `${prefix}-${String(value).padStart(4, '0')}`
}

/** readPersistedCustomerAccountNoCeiling extracts the highest numeric CA sequence already stored in the database. */
async function readPersistedCustomerAccountNoCeiling(
  client: Prisma.TransactionClient | PrismaService
): Promise<number> {
  const rows = await client.$queryRaw<Array<{ maxSequence: number | null }>>(Prisma.sql`
    SELECT MAX(
      CASE
        WHEN "customerAccountNo" ~ '^CA-[0-9]+$'
        THEN CAST(SUBSTRING("customerAccountNo" FROM 4) AS INTEGER)
        ELSE NULL
      END
    ) AS "maxSequence"
    FROM "CustomerAccount"
  `)

  return rows[0]?.maxSequence ?? 0
}

/** isTenantPartyBindingUniqueViolation detects the Prisma uniqueness error that enforces one binding per tenant-party pair. */
function isTenantPartyBindingUniqueViolation(
  error: unknown,
  account: CustomerAccountRecord
): error is Prisma.PrismaClientKnownRequestError {
  if (!account.primaryBinding) {
    return false
  }

  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false
  }

  const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : []
  return target.includes('tenantId') && target.includes('tenantPartyId')
}

/** isCustomerAccountNoUniqueViolation detects duplicate CRM account-number writes that should map to ALREADY_EXISTS. */
function isCustomerAccountNoUniqueViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false
  }

  const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : []
  return target.includes('customerAccountNo')
}
