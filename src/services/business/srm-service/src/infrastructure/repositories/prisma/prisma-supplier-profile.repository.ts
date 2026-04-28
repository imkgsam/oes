import { Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  Prisma,
  SrmSupplierStatus as PrismaSupplierStatus
} from '../../../../prisma/generated/prisma'
import { SRM_ALREADY_EXISTS } from '../../../common/errors/srm.errors'
import {
  SupplierProfileRecord,
  SupplierStatus,
  PageResult,
  SearchSuppliersInput
} from '../../../domain/models/srm-records'
import { SupplierProfileRepository } from '../../../domain/repositories/supplier-profile.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaSrmRecordMapper } from './prisma-srm-record.mapper'

/** PrismaSupplierProfileRepository persists SRM supplier-profile shells and allocates globally unique supplier numbers. */
@Injectable()
export class PrismaSupplierProfileRepository implements SupplierProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextSupplierProfileNo(tenantId: string): Promise<string> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.srmSequenceCounter.upsert({
        where: {
          tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY
        },
        create: {
          tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY,
          nextSupplierProfileNo: 1
        },
        update: {}
      })

      const [globalCounter, highestCounter, persistedCeiling] = await Promise.all([
        client.srmSequenceCounter.findUniqueOrThrow({
          where: {
            tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY
          },
          select: {
            nextSupplierProfileNo: true
          }
        }),
        client.srmSequenceCounter.aggregate({
          _max: {
            nextSupplierProfileNo: true
          }
        }),
        readPersistedSupplierProfileNoCeiling(client)
      ])

      const nextSupplierProfileNo = Math.max(
        globalCounter.nextSupplierProfileNo,
        highestCounter._max.nextSupplierProfileNo ?? 1,
        persistedCeiling + 1
      )

      await client.srmSequenceCounter.updateMany({
        where: {
          tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY,
          nextSupplierProfileNo: {
            lt: nextSupplierProfileNo
          }
        },
        data: {
          nextSupplierProfileNo
        }
      })

      const updated = await client.srmSequenceCounter.update({
        where: {
          tenantId: CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY
        },
        data: {
          nextSupplierProfileNo: {
            increment: 1
          }
        },
        select: {
          nextSupplierProfileNo: true
        }
      })

      return formatDocumentNo(CUSTOMER_ACCOUNT_NO_PREFIX, updated.nextSupplierProfileNo - 1)
    })
  }

  async findById(tenantId: string, supplierId: string): Promise<SupplierProfileRecord | null> {
    const record = await this.prisma.getExecutionClient().supplierProfile.findFirst({
      where: {
        tenantId,
        id: supplierId
      },
      include: PrismaSrmRecordMapper.supplierProfileIncludeValue()
    })

    return record ? PrismaSrmRecordMapper.toSupplierProfile(record) : null
  }

  async findByTenantPartyId(tenantId: string, tenantPartyId: string): Promise<SupplierProfileRecord | null> {
    const record = await this.prisma.getExecutionClient().supplierProfile.findFirst({
      where: {
        tenantId,
        partyBinding: {
          is: {
            tenantPartyId
          }
        }
      },
      include: PrismaSrmRecordMapper.supplierProfileIncludeValue()
    })

    return record ? PrismaSrmRecordMapper.toSupplierProfile(record) : null
  }

  async save(profile: SupplierProfileRecord): Promise<SupplierProfileRecord> {
    try {
      return await this.prisma.runInTransaction(async () => {
        const client = this.prisma.getExecutionClient()
        await client.supplierProfile.upsert({
          where: {
            id: profile.id
          },
          create: {
            id: profile.id,
            supplierNo: profile.supplierNo,
            tenantId: profile.tenantId,
            displayName: profile.displayName,
            status: PrismaSrmRecordMapper.toPersistedSupplierStatus(profile.status),
            supplierCategory: profile.supplierCategory ?? null,
            tags: PrismaSrmRecordMapper.toInputJson(profile.tags)
          },
          update: {
            supplierNo: profile.supplierNo,
            displayName: profile.displayName,
            status: PrismaSrmRecordMapper.toPersistedSupplierStatus(profile.status),
            supplierCategory: profile.supplierCategory ?? null,
            tags: PrismaSrmRecordMapper.toInputJson(profile.tags)
          }
        })

        if (profile.partyBinding) {
          await client.supplierPartyBinding.upsert({
            where: {
              supplierId: profile.id
            },
            create: {
              id: profile.partyBinding.supplierPartyBindingId,
              tenantId: profile.partyBinding.tenantId,
              supplierId: profile.id,
              tenantPartyId: profile.partyBinding.tenantPartyId,
              bindingStatus: PrismaSrmRecordMapper.toPersistedBindingStatus(profile.partyBinding.bindingStatus),
              partyDisplayName: profile.partyBinding.partyDisplayName ?? null
            },
            update: {
              tenantPartyId: profile.partyBinding.tenantPartyId,
              bindingStatus: PrismaSrmRecordMapper.toPersistedBindingStatus(profile.partyBinding.bindingStatus),
              partyDisplayName: profile.partyBinding.partyDisplayName ?? null
            }
          })
        } else {
          await client.supplierPartyBinding.deleteMany({
            where: {
              supplierId: profile.id
            }
          })
        }

        const saved = await client.supplierProfile.findUniqueOrThrow({
          where: {
            id: profile.id
          },
          include: PrismaSrmRecordMapper.supplierProfileIncludeValue()
        })

        return PrismaSrmRecordMapper.toSupplierProfile(saved)
      })
    } catch (error) {
      if (isTenantPartyBindingUniqueViolation(error, profile)) {
        throw ExceptionFactory.application(SRM_ALREADY_EXISTS, {
          reason: 'tenantParty is already bound to another supplier profile',
          tenantPartyId: profile.partyBinding?.tenantPartyId,
          supplierId: profile.id
        })
      }

      if (isSupplierProfileNoUniqueViolation(error)) {
        throw ExceptionFactory.application(SRM_ALREADY_EXISTS, {
          reason: 'supplierNo is already occupied by another supplier profile',
          supplierNo: profile.supplierNo,
          supplierId: profile.id
        })
      }

      throw error
    }
  }

  async search(input: SearchSuppliersInput): Promise<PageResult<SupplierProfileRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const where = buildSearchWhere(input)

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().supplierProfile.count({ where }),
      this.prisma.getExecutionClient().supplierProfile.findMany({
        where,
        include: PrismaSrmRecordMapper.supplierProfileIncludeValue(),
        orderBy: {
          supplierNo: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => PrismaSrmRecordMapper.toSupplierProfile(item)),
      total,
      page,
      pageSize
    }
  }

}

const CUSTOMER_ACCOUNT_NO_PREFIX = 'CA'
const CUSTOMER_ACCOUNT_NO_SEQUENCE_KEY = '__global_supplier_no__'

/** buildSearchWhere translates the SRM supplier-directory filters into a Prisma where clause. */
function buildSearchWhere(input: SearchSuppliersInput): Prisma.SupplierProfileWhereInput {
  return {
    tenantId: input.tenantId,
    status: input.status ? PrismaSrmRecordMapper.toPersistedSupplierStatus(input.status) : undefined,
    partyBinding: input.tenantPartyId
      ? {
          is: {
            tenantPartyId: input.tenantPartyId
          }
        }
      : undefined,
    OR: input.keyword
      ? [
          {
            supplierNo: {
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
            partyBinding: {
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

/** formatDocumentNo converts one numeric sequence into the frozen SRM supplier-number summary format. */
function formatDocumentNo(prefix: string, value: number): string {
  return `${prefix}-${String(value).padStart(4, '0')}`
}

/** readPersistedSupplierProfileNoCeiling extracts the highest numeric CA sequence already stored in the database. */
async function readPersistedSupplierProfileNoCeiling(
  client: Prisma.TransactionClient | PrismaService
): Promise<number> {
  const rows = await client.$queryRaw<Array<{ maxSequence: number | null }>>(Prisma.sql`
    SELECT MAX(
      CASE
        WHEN "supplierNo" ~ '^CA-[0-9]+$'
        THEN CAST(SUBSTRING("supplierNo" FROM 4) AS INTEGER)
        ELSE NULL
      END
    ) AS "maxSequence"
    FROM "SupplierProfile"
  `)

  return rows[0]?.maxSequence ?? 0
}

/** isTenantPartyBindingUniqueViolation detects the Prisma uniqueness error that enforces one binding per tenant-party pair. */
function isTenantPartyBindingUniqueViolation(
  error: unknown,
  profile: SupplierProfileRecord
): error is Prisma.PrismaClientKnownRequestError {
  if (!profile.partyBinding) {
    return false
  }

  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false
  }

  const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : []
  return target.includes('tenantId') && target.includes('tenantPartyId')
}

/** isSupplierProfileNoUniqueViolation detects duplicate SRM account-number writes that should map to ALREADY_EXISTS. */
function isSupplierProfileNoUniqueViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false
  }

  const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : []
  return target.includes('supplierNo')
}
