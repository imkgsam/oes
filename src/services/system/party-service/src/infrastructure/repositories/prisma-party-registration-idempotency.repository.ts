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
        party: true,
        tenantParty: true
      }
    })

    return record ? mapRecord(record) : null
  }

  async saveCompleted(input: {
    idempotencyKey: string
    requestHash: string
    operation: string
    partyId: string
    tenantPartyId?: string | undefined
    matchResult?: string | undefined
  }): Promise<PartyRegistrationIdempotencyRecord> {
    try {
      const record = await this.prisma.partyRegistrationIdempotency.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          requestHash: input.requestHash,
          operation: input.operation,
          partyId: input.partyId,
          tenantPartyId: input.tenantPartyId ?? null,
          matchResult: input.matchResult ?? null
        },
        include: {
          party: true,
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
  party: {
    id: string
    type: string
    status: string
    canonicalName: string
    displayName: string | null
  }
  tenantParty: {
    id: string
    tenantId: string
    partyId: string
    localDisplayName: string | null
    localCode: string | null
    status: string
  } | null
}): PartyRegistrationIdempotencyRecord {
  return {
    idempotencyKey: record.idempotencyKey,
    requestHash: record.requestHash,
    operation: record.operation,
    party: {
      id: record.party.id,
      type: record.party.type as never,
      status: record.party.status as never,
      canonicalName: record.party.canonicalName,
      displayName: record.party.displayName
    },
    tenantParty: record.tenantParty
      ? {
          id: record.tenantParty.id,
          tenantId: record.tenantParty.tenantId,
          partyId: record.tenantParty.partyId,
          localDisplayName: record.tenantParty.localDisplayName,
          localCode: record.tenantParty.localCode,
          status: record.tenantParty.status
        }
      : null,
    matchResult: record.matchResult
  }
}
