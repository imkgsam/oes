import { Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ITEM_MASTER_ALREADY_EXISTS } from '../../../common/errors/item-master.errors'
import {
  ListSupplierItemMappingsByItemInput,
  ListSupplierItemMappingsByItemResult,
  ResolveSupplierItemMappingInput,
  SupplierItemMapping,
  SupplierItemMappingRepository,
  UpsertSupplierItemMappingInput
} from '../../../domain/repositories/supplier-item-mapping.repository'
import { PrismaService } from '../../prisma/prisma.service'

/** PrismaSupplierItemMappingRepository persists supplier-to-item alias mappings without procurement fields. */
@Injectable()
export class PrismaSupplierItemMappingRepository implements SupplierItemMappingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(input: UpsertSupplierItemMappingInput): Promise<SupplierItemMapping> {
    const codeKey = normalizeLookup(input.supplierItemCode)
    const nameKey = normalizeLookup(input.supplierItemName)
    const existingMatches = await this.prisma.getExecutionClient().supplierItemMapping.findMany({
      where: {
        tenantId: input.tenantId,
        supplierId: input.supplierId,
        OR: [
          ...(codeKey ? [{ supplierItemCodeKey: codeKey }] : []),
          ...(nameKey ? [{ supplierItemNameKey: nameKey }] : [])
        ]
      }
    })

    const existingIds = Array.from(new Set(existingMatches.map((record) => record.id)))
    if (existingIds.length > 1) {
      throw ExceptionFactory.domain(ITEM_MASTER_ALREADY_EXISTS, {
        reason: 'supplier item mapping aliases collide with multiple records'
      })
    }

    const record = existingIds.length === 1
      ? await this.prisma.getExecutionClient().supplierItemMapping.update({
          where: { id: existingIds[0] },
          data: {
            supplierItemCode: normalizeValue(input.supplierItemCode),
            supplierItemName: normalizeValue(input.supplierItemName),
            supplierItemCodeKey: codeKey,
            supplierItemNameKey: nameKey,
            itemId: input.itemId
          }
        })
      : await this.prisma.getExecutionClient().supplierItemMapping.create({
          data: {
            tenantId: input.tenantId,
            supplierId: input.supplierId,
            supplierItemCode: normalizeValue(input.supplierItemCode),
            supplierItemName: normalizeValue(input.supplierItemName),
            supplierItemCodeKey: codeKey,
            supplierItemNameKey: nameKey,
            itemId: input.itemId
          }
        })

    return toSupplierItemMapping(record)
  }

  async listByItem(input: ListSupplierItemMappingsByItemInput): Promise<ListSupplierItemMappingsByItemResult> {
    const where = {
      tenantId: input.tenantId,
      itemId: input.itemId
    }
    const queryArgs = {
      where,
      orderBy: [{ supplierId: 'asc' as const }, { id: 'asc' as const }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize
    }

    const [total, records] = this.prisma.hasActiveTransaction()
      ? await Promise.all([
          this.prisma.getExecutionClient().supplierItemMapping.count({ where }),
          this.prisma.getExecutionClient().supplierItemMapping.findMany(queryArgs)
        ])
      : await this.prisma.$transaction([
          this.prisma.supplierItemMapping.count({ where }),
          this.prisma.supplierItemMapping.findMany(queryArgs)
        ])

    return {
      mappings: records.map(toSupplierItemMapping),
      total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  async resolve(input: ResolveSupplierItemMappingInput): Promise<SupplierItemMapping | null> {
    const codeKey = normalizeLookup(input.supplierItemCode)
    const nameKey = normalizeLookup(input.supplierItemName)

    let record = codeKey && nameKey
      ? await this.prisma.getExecutionClient().supplierItemMapping.findFirst({
          where: {
            tenantId: input.tenantId,
            supplierId: input.supplierId,
            supplierItemCodeKey: codeKey,
            supplierItemNameKey: nameKey
          }
        })
      : null

    if (!record && codeKey) {
      record = await this.prisma.getExecutionClient().supplierItemMapping.findFirst({
        where: {
          tenantId: input.tenantId,
          supplierId: input.supplierId,
          supplierItemCodeKey: codeKey
        }
      })
    }

    if (!record && nameKey) {
      record = await this.prisma.getExecutionClient().supplierItemMapping.findFirst({
        where: {
          tenantId: input.tenantId,
          supplierId: input.supplierId,
          supplierItemNameKey: nameKey
        }
      })
    }

    return record ? toSupplierItemMapping(record) : null
  }
}

/** normalizeLookup lowers and trims one supplier alias for matching and uniqueness. */
function normalizeLookup(value?: string): string | undefined {
  const normalized = normalizeValue(value)
  return normalized ? normalized.toLowerCase() : undefined
}

/** normalizeValue trims blank supplier alias values into undefined for storage consistency. */
function normalizeValue(value?: string): string | undefined {
  if (!value) {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

/** toSupplierItemMapping maps one Prisma row into the repository contract shape. */
function toSupplierItemMapping(record: {
  id: string
  tenantId: string
  supplierId: string
  supplierItemCode: string | null
  supplierItemName: string | null
  itemId: string
}): SupplierItemMapping {
  return {
    id: record.id,
    tenantId: record.tenantId,
    supplierId: record.supplierId,
    supplierItemCode: record.supplierItemCode ?? undefined,
    supplierItemName: record.supplierItemName ?? undefined,
    itemId: record.itemId
  }
}
