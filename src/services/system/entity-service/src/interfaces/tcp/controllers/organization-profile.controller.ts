// File: src/services/system/entity-service/src/interfaces/tcp/controllers/organization-profile.controller.ts
import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import {
  OrganizationProfileDto,
  EntityIdRequestDto,
  CreateOrganizationProfileRequestDto,
  UpdateOrganizationProfileRequestDto
} from '@oes/common/dtos/entity-service/all.dto'
import { IEntityServiceRpcOrganizationProfileContract } from '@oes/common/interfaces/services/entity-service'
import { ENTITY_MESSAGES } from '@oes/common/constants/messages/entity.message'
import { RpcRequestData } from '@oes/common/decorators/rpc-request-data.decorator'
import { OrganizationProfileService } from '../../../application/services/organization-profile.service'

@Controller()
export class OrganizationProfileController implements IEntityServiceRpcOrganizationProfileContract {
  constructor(private readonly organizationProfileService: OrganizationProfileService) {}

  @MessagePattern(ENTITY_MESSAGES.CREATE_ORGANIZATION_PROFILE)
  async createOrganizationProfile(
    @RpcRequestData() data: CreateOrganizationProfileRequestDto
  ): Promise<OrganizationProfileDto> {
    const profile = await this.organizationProfileService.createOrganizationProfile(data.entityId, {
      legalName: data.legalName,
      registrationNumber: data.registrationNumber,
      taxId: data.taxId,
      country: data.country,
      website: data.website
    })
    return profile.toJSON()
  }

  @MessagePattern(ENTITY_MESSAGES.GET_ORGANIZATION_PROFILE_BY_ENTITY_ID)
  async getOrganizationProfileByEntityId(
    @RpcRequestData() data: EntityIdRequestDto
  ): Promise<OrganizationProfileDto | null> {
    try {
      const profile = await this.organizationProfileService.getOrganizationProfileByEntityId(
        data.entityId
      )
      return profile.toJSON()
    } catch {
      return null
    }
  }

  @MessagePattern(ENTITY_MESSAGES.UPDATE_ORGANIZATION_PROFILE)
  async updateOrganizationProfile(
    @RpcRequestData() data: UpdateOrganizationProfileRequestDto
  ): Promise<OrganizationProfileDto> {
    const profile = await this.organizationProfileService.updateOrganizationProfile(data.entityId, {
      legalName: data.legalName,
      registrationNumber: data.registrationNumber,
      taxId: data.taxId,
      country: data.country,
      website: data.website
    })
    return profile.toJSON()
  }

  @MessagePattern(ENTITY_MESSAGES.DELETE_ORGANIZATION_PROFILE)
  async deleteOrganizationProfile(@RpcRequestData() data: EntityIdRequestDto): Promise<void> {
    await this.organizationProfileService.deleteOrganizationProfile(data.entityId)
  }
}
