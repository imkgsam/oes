import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { DeactivateTenantPartyInput, TenantPartyRepository, TenantPartySummary } from '../../domain/repositories'
import { PrismaService } from '../prisma/prisma.service'
import { TenantPartyStatus } from '../../domain/value-objects'

/** PrismaTenantPartyRepository persists tenant-scoped party bindings and their lifecycle. */
@Injectable()
export class PrismaTenantPartyRepository implements TenantPartyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, tenantPartyId: string): Promise<TenantPartySummary | null> {
    const tenantParty = await this.prisma.tenantParty.findFirst({
      where: {
        id: tenantPartyId,
        tenantId
      }
    })

    return tenantParty ? mapTenantParty(tenantParty) : null
  }

  async findByTenantAndPartyId(tenantId: string, partyId: string): Promise<TenantPartySummary | null> {
    const tenantParty = await this.prisma.tenantParty.findUnique({
      where: {
        tenantId_partyId: {
          tenantId,
          partyId
        }
      }
    })

    return tenantParty ? mapTenantParty(tenantParty) : null
  }

  async create(data: {
    tenantId: string
    partyId: string
    localDisplayName?: string | undefined
    localCode?: string | undefined
    tags?: string[] | undefined
  }): Promise<TenantPartySummary> {
    try {
      const tenantParty = await this.prisma.tenantParty.create({
        data: {
          tenantId: data.tenantId,
          partyId: data.partyId,
          localDisplayName: data.localDisplayName ?? null,
          localCode: data.localCode ?? null,
          tags: data.tags ?? null,
          status: TenantPartyStatus.ACTIVE
        }
      })

      return mapTenantParty(tenantParty)
    } catch (error) {
      throw new ConflictException(`Tenant ${data.tenantId} already bound party ${data.partyId}`)
    }
  }

  async deactivate(data: DeactivateTenantPartyInput): Promise<TenantPartySummary> {
    const tenantParty = await this.findById(data.tenantId, data.tenantPartyId)
    if (!tenantParty) {
      throw new NotFoundException(`Tenant party ${data.tenantPartyId} not found`)
    }

    const updated = await this.prisma.tenantParty.update({
      where: { id: data.tenantPartyId },
      data: {
        status: TenantPartyStatus.INACTIVE
      }
    })

    return mapTenantParty(updated)
  }
}

function mapTenantParty(tenantParty: {
  id: string
  tenantId: string
  partyId: string
  localDisplayName: string | null
  localCode: string | null
  status: string
}): TenantPartySummary {
  return {
    id: tenantParty.id,
    tenantId: tenantParty.tenantId,
    partyId: tenantParty.partyId,
    localDisplayName: tenantParty.localDisplayName,
    localCode: tenantParty.localCode,
    status: tenantParty.status
  }
}
