import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { OrganizationProfile } from '../../domain/entities'
import {
  IOrganizationProfileRepository,
  CreateOrganizationProfileData,
  UpdateOrganizationProfileData
} from '../../domain/repositories'

@Injectable()
export class OrganizationProfileRepository implements IOrganizationProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrganizationProfileData): Promise<OrganizationProfile> {
    const record = await this.prisma.organizationProfile.create({
      data: {
        entityId: data.entityId,
        legalName: data.legalName,
        registrationNumber: data.registrationNumber,
        taxId: data.taxId,
        country: data.country,
        website: data.website
      }
    })

    return this.mapToOrganizationProfile(record)
  }

  async findByEntityId(entityId: string): Promise<OrganizationProfile | null> {
    const record = await this.prisma.organizationProfile.findUnique({
      where: { entityId }
    })

    if (!record) {
      return null
    }

    return this.mapToOrganizationProfile(record)
  }

  async findByRegistrationNumber(registrationNumber: string): Promise<OrganizationProfile | null> {
    const record = await this.prisma.organizationProfile.findUnique({
      where: { registrationNumber }
    })

    if (!record) {
      return null
    }

    return this.mapToOrganizationProfile(record)
  }

  async findByTaxId(taxId: string): Promise<OrganizationProfile | null> {
    const record = await this.prisma.organizationProfile.findUnique({
      where: { taxId }
    })

    if (!record) {
      return null
    }

    return this.mapToOrganizationProfile(record)
  }

  async update(
    entityId: string,
    data: UpdateOrganizationProfileData
  ): Promise<OrganizationProfile> {
    const record = await this.prisma.organizationProfile.update({
      where: { entityId },
      data: {
        ...(data.legalName !== undefined && { legalName: data.legalName }),
        ...(data.registrationNumber !== undefined && {
          registrationNumber: data.registrationNumber
        }),
        ...(data.taxId !== undefined && { taxId: data.taxId }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.website !== undefined && { website: data.website })
      }
    })

    return this.mapToOrganizationProfile(record)
  }

  async delete(entityId: string): Promise<void> {
    await this.prisma.organizationProfile.delete({
      where: { entityId }
    })
  }

  private mapToOrganizationProfile(record: {
    id: string
    entityId: string
    legalName: string | null
    registrationNumber: string | null
    taxId: string | null
    country: string | null
    website: string | null
    createdAt: Date
    updatedAt: Date
  }): OrganizationProfile {
    return OrganizationProfile.create({
      id: record.id,
      entityId: record.entityId,
      legalName: record.legalName,
      registrationNumber: record.registrationNumber,
      taxId: record.taxId,
      country: record.country,
      website: record.website,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    })
  }
}
