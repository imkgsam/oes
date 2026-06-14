import { ConflictException, Injectable } from '@nestjs/common'
import {
  PartyRegistrationIdempotencyRecord,
  PartyRegistrationIdempotencyRepository
} from '../../domain/repositories'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaPartyRegistrationIdempotencyRepository persists completed party registration outcomes for safe retries. */
@Injectable()
export class PrismaPartyRegistrationIdempotencyRepository implements PartyRegistrationIdempotencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(idempotencyKey: string): Promise<PartyRegistrationIdempotencyRecord | null> {
    const record = await this.prisma.partyRegistrationIdempotency.findUnique({
      where: { idempotencyKey },
      include: {
        tenantParty: true
      }
    })

    return record ? mapRecord(record) : null
  }

  async saveCompleted(input: {
    idempotencyKey: string
    requestHash: string
    operation: string
    tenantPartyId: string
    matchResult?: string | undefined
  }): Promise<PartyRegistrationIdempotencyRecord> {
    try {
      const record = await this.prisma.partyRegistrationIdempotency.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          requestHash: input.requestHash,
          operation: input.operation,
          tenantPartyId: input.tenantPartyId,
          matchResult: input.matchResult ?? null
        },
        include: {
          tenantParty: true
        }
      })

      return mapRecord(record)
    } catch (error) {
      const existing = await this.findByKey(input.idempotencyKey)
      if (existing && existing.requestHash === input.requestHash) {
        return existing
      }

      throw new ConflictException(`Idempotency key ${input.idempotencyKey} was already used with a different request`)
    }
  }
}

/** mapRecord converts Prisma registration idempotency rows into the domain repository contract. */
function mapRecord(record: {
  idempotencyKey: string
  requestHash: string
  operation: string
  matchResult: string | null
  tenantParty: {
    id: string
    tenantId: string
    type: string
    legalName: string
    displayName: string | null
    localCode: string | null
    registeredCountry: string | null
    status: string
  }
}): PartyRegistrationIdempotencyRecord {
  return {
    idempotencyKey: record.idempotencyKey,
    requestHash: record.requestHash,
    operation: record.operation,
    tenantParty: {
      id: record.tenantParty.id,
      tenantId: record.tenantParty.tenantId,
      type: record.tenantParty.type as never,
      legalName: record.tenantParty.legalName,
      displayName: record.tenantParty.displayName,
      localCode: record.tenantParty.localCode,
      registeredCountry: record.tenantParty.registeredCountry,
      status: record.tenantParty.status
    },
    matchResult: record.matchResult
  }
}
