import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException
} from '@nestjs/common'
import { PersonProfile } from '../../domain/entities'
import { EntityType } from '../../domain/value-objects'
import {
  IEntityRepository,
  ENTITY_REPOSITORY
} from '../../domain/repositories/entity.repository.interface'
import {
  IPersonProfileRepository,
  PERSON_PROFILE_REPOSITORY,
  CreatePersonProfileData,
  UpdatePersonProfileData
} from '../../domain/repositories/person-profile.repository.interface'

@Injectable()
export class PersonProfileService {
  constructor(
    @Inject(ENTITY_REPOSITORY)
    private readonly entityRepository: IEntityRepository,
    @Inject(PERSON_PROFILE_REPOSITORY)
    private readonly personProfileRepository: IPersonProfileRepository
  ) {}

  async createPersonProfile(
    entityId: string,
    data: Omit<CreatePersonProfileData, 'entityId'>
  ): Promise<PersonProfile> {
    const entity = await this.entityRepository.findById(entityId)
    if (!entity) {
      throw new NotFoundException(`Entity with id ${entityId} not found`)
    }

    if (entity.type !== EntityType.PERSON) {
      throw new BadRequestException(
        `Entity ${entityId} is not a PERSON type. Cannot create person profile.`
      )
    }

    const existingProfile = await this.personProfileRepository.findByEntityId(entityId)
    if (existingProfile) {
      throw new ConflictException(`Person profile already exists for entity ${entityId}`)
    }

    if (data.idNumber) {
      const existingByIdNumber = await this.personProfileRepository.findByIdNumber(data.idNumber)
      if (existingByIdNumber) {
        throw new ConflictException(`ID number ${data.idNumber} is already in use`)
      }
    }

    if (data.passportNumber) {
      const existingByPassport = await this.personProfileRepository.findByPassportNumber(
        data.passportNumber
      )
      if (existingByPassport) {
        throw new ConflictException(`Passport number ${data.passportNumber} is already in use`)
      }
    }

    return this.personProfileRepository.create({
      entityId,
      ...data
    })
  }

  async getPersonProfileByEntityId(entityId: string): Promise<PersonProfile> {
    const profile = await this.personProfileRepository.findByEntityId(entityId)
    if (!profile) {
      throw new NotFoundException(`Person profile for entity ${entityId} not found`)
    }
    return profile
  }

  async updatePersonProfile(
    entityId: string,
    data: UpdatePersonProfileData
  ): Promise<PersonProfile> {
    const existingProfile = await this.personProfileRepository.findByEntityId(entityId)
    if (!existingProfile) {
      throw new NotFoundException(`Person profile for entity ${entityId} not found`)
    }

    if (data.idNumber && data.idNumber !== existingProfile.idNumber) {
      const existingByIdNumber = await this.personProfileRepository.findByIdNumber(data.idNumber)
      if (existingByIdNumber && existingByIdNumber.entityId !== entityId) {
        throw new ConflictException(`ID number ${data.idNumber} is already in use`)
      }
    }

    if (data.passportNumber && data.passportNumber !== existingProfile.passportNumber) {
      const existingByPassport = await this.personProfileRepository.findByPassportNumber(
        data.passportNumber
      )
      if (existingByPassport && existingByPassport.entityId !== entityId) {
        throw new ConflictException(`Passport number ${data.passportNumber} is already in use`)
      }
    }

    return this.personProfileRepository.update(entityId, data)
  }

  async deletePersonProfile(entityId: string): Promise<void> {
    const existingProfile = await this.personProfileRepository.findByEntityId(entityId)
    if (!existingProfile) {
      throw new NotFoundException(`Person profile for entity ${entityId} not found`)
    }
    await this.personProfileRepository.delete(entityId)
  }
}
