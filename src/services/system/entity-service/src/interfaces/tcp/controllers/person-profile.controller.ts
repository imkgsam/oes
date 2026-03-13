// File: src/services/system/entity-service/src/interfaces/tcp/controllers/person-profile.controller.ts
import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import {
  PersonProfileDto,
  EntityIdRequestDto,
  CreatePersonProfileRequestDto,
  UpdatePersonProfileRequestDto
} from '@oes/common/dtos'
import { IEntityServiceRpcPersonProfileContract } from '@oes/common/interfaces'
import { ENTITY_MESSAGES } from '@oes/common/constants'
import { RpcRequestData } from '@oes/common/decorators'
import { PersonProfileService } from '../../../application/services/person-profile.service'

@Controller()
export class PersonProfileController implements IEntityServiceRpcPersonProfileContract {
  constructor(private readonly personProfileService: PersonProfileService) {}

  @MessagePattern(ENTITY_MESSAGES.CREATE_PERSON_PROFILE)
  async createPersonProfile(
    @RpcRequestData() data: CreatePersonProfileRequestDto
  ): Promise<PersonProfileDto> {
    const profile = await this.personProfileService.createPersonProfile(data.entityId, {
      gender: data.gender,
      birthday: data.birthday ? new Date(data.birthday) : undefined,
      idNumber: data.idNumber,
      passportNumber: data.passportNumber
    })
    return profile.toJSON()
  }

  @MessagePattern(ENTITY_MESSAGES.GET_PERSON_PROFILE_BY_ENTITY_ID)
  async getPersonProfileByEntityId(
    @RpcRequestData() data: EntityIdRequestDto
  ): Promise<PersonProfileDto | null> {
    try {
      const profile = await this.personProfileService.getPersonProfileByEntityId(data.entityId)
      return profile.toJSON()
    } catch {
      return null
    }
  }

  @MessagePattern(ENTITY_MESSAGES.UPDATE_PERSON_PROFILE)
  async updatePersonProfile(
    @RpcRequestData() data: UpdatePersonProfileRequestDto
  ): Promise<PersonProfileDto> {
    const profile = await this.personProfileService.updatePersonProfile(data.entityId, {
      gender: data.gender,
      birthday: data.birthday ? new Date(data.birthday) : data.birthday,
      idNumber: data.idNumber,
      passportNumber: data.passportNumber
    })
    return profile.toJSON()
  }

  @MessagePattern(ENTITY_MESSAGES.DELETE_PERSON_PROFILE)
  async deletePersonProfile(@RpcRequestData() data: EntityIdRequestDto): Promise<void> {
    await this.personProfileService.deletePersonProfile(data.entityId)
  }
}
