// File: src/common/contracts/entity-service/all.port.ts
import {
  EntityDto,
  PersonProfileDto,
  OrganizationProfileDto,
  EntityIdRequestDto,
  CreateEntityRequestDto,
  UpdateEntityRequestDto,
  ListEntitiesRequestDto,
  CreatePersonProfileRequestDto,
  UpdatePersonProfileRequestDto,
  CreateOrganizationProfileRequestDto,
  UpdateOrganizationProfileRequestDto,
  EntityListResponseDto
} from '../../dtos/entity-service/all.dto'
export interface EntityPort {
  createEntity(data: CreateEntityRequestDto): Promise<EntityDto>
  getEntityById(data: EntityIdRequestDto): Promise<EntityDto | null>
  listEntities(data: ListEntitiesRequestDto): Promise<EntityListResponseDto>
  updateEntity(data: UpdateEntityRequestDto): Promise<EntityDto>
  deleteEntity(data: EntityIdRequestDto): Promise<void>
}

export interface ProfilePort {
  createPersonProfile(data: CreatePersonProfileRequestDto): Promise<PersonProfileDto>
  getPersonProfileByEntityId(data: EntityIdRequestDto): Promise<PersonProfileDto | null>
  updatePersonProfile(data: UpdatePersonProfileRequestDto): Promise<PersonProfileDto>
  deletePersonProfile(data: EntityIdRequestDto): Promise<void>
}
export interface OrganizationPort {
  createOrganizationProfile(
    data: CreateOrganizationProfileRequestDto
  ): Promise<OrganizationProfileDto>
  getOrganizationProfileByEntityId(data: EntityIdRequestDto): Promise<OrganizationProfileDto | null>
  updateOrganizationProfile(
    data: UpdateOrganizationProfileRequestDto
  ): Promise<OrganizationProfileDto>
  deleteOrganizationProfile(data: EntityIdRequestDto): Promise<void>
}
