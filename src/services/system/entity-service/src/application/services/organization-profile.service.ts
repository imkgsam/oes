import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException
} from '@nestjs/common'
import { OrganizationProfile } from '../../domain/entities'
import { EntityType } from '../../domain/value-objects'
import {
  IEntityRepository,
  ENTITY_REPOSITORY
} from '../../domain/repositories/entity.repository.interface'
import {
  IOrganizationProfileRepository,
  ORGANIZATION_PROFILE_REPOSITORY,
  CreateOrganizationProfileData,
  UpdateOrganizationProfileData
} from '../../domain/repositories/organization-profile.repository.interface'

@Injectable()
export class OrganizationProfileService {
  constructor(
    @Inject(ENTITY_REPOSITORY)
    private readonly entityRepository: IEntityRepository,
    @Inject(ORGANIZATION_PROFILE_REPOSITORY)
    private readonly organizationProfileRepository: IOrganizationProfileRepository
  ) {}

  async createOrganizationProfile(
    entityId: string,
    data: Omit<CreateOrganizationProfileData, 'entityId'>
  ): Promise<OrganizationProfile> {
    const entity = await this.entityRepository.findById(entityId)
    if (!entity) {
      throw new NotFoundException(`Entity with id ${entityId} not found`)
    }

    if (entity.type !== EntityType.ORGANIZATION) {
      throw new BadRequestException(
        `Entity ${entityId} is not an ORGANIZATION type. Cannot create organization profile.`
      )
    }

    const existingProfile = await this.organizationProfileRepository.findByEntityId(entityId)
    if (existingProfile) {
      throw new ConflictException(`Organization profile already exists for entity ${entityId}`)
    }

    if (data.registrationNumber) {
      const existingByRegNumber = await this.organizationProfileRepository.findByRegistrationNumber(
        data.registrationNumber
      )
      if (existingByRegNumber) {
        throw new ConflictException(
          `Registration number ${data.registrationNumber} is already in use`
        )
      }
    }

    if (data.taxId) {
      const existingByTaxId = await this.organizationProfileRepository.findByTaxId(data.taxId)
      if (existingByTaxId) {
        throw new ConflictException(`Tax ID ${data.taxId} is already in use`)
      }
    }

    return this.organizationProfileRepository.create({
      entityId,
      ...data
    })
  }

  async getOrganizationProfileByEntityId(entityId: string): Promise<OrganizationProfile> {
    const profile = await this.organizationProfileRepository.findByEntityId(entityId)
    if (!profile) {
      throw new NotFoundException(`Organization profile for entity ${entityId} not found`)
    }
    return profile
  }

  async updateOrganizationProfile(
    entityId: string,
    data: UpdateOrganizationProfileData
  ): Promise<OrganizationProfile> {
    const existingProfile = await this.organizationProfileRepository.findByEntityId(entityId)
    if (!existingProfile) {
      throw new NotFoundException(`Organization profile for entity ${entityId} not found`)
    }

    if (data.registrationNumber && data.registrationNumber !== existingProfile.registrationNumber) {
      const existingByRegNumber = await this.organizationProfileRepository.findByRegistrationNumber(
        data.registrationNumber
      )
      if (existingByRegNumber && existingByRegNumber.entityId !== entityId) {
        throw new ConflictException(
          `Registration number ${data.registrationNumber} is already in use`
        )
      }
    }

    if (data.taxId && data.taxId !== existingProfile.taxId) {
      const existingByTaxId = await this.organizationProfileRepository.findByTaxId(data.taxId)
      if (existingByTaxId && existingByTaxId.entityId !== entityId) {
        throw new ConflictException(`Tax ID ${data.taxId} is already in use`)
      }
    }

    return this.organizationProfileRepository.update(entityId, data)
  }

  async deleteOrganizationProfile(entityId: string): Promise<void> {
    const existingProfile = await this.organizationProfileRepository.findByEntityId(entityId)
    if (!existingProfile) {
      throw new NotFoundException(`Organization profile for entity ${entityId} not found`)
    }
    await this.organizationProfileRepository.delete(entityId)
  }
}
