import {
  CreateEntityRequestDto,
  CreateOrganizationProfileRequestDto,
  CreatePersonProfileRequestDto,
  EntityDto,
  EntityIdRequestDto,
  EntityListResponseDto,
  ListEntitiesRequestDto,
  OrganizationProfileDto,
  PersonProfileDto,
  UpdateEntityRequestDto,
  UpdateOrganizationProfileRequestDto,
  UpdatePersonProfileRequestDto
} from '../../dtos'

export interface IEntityServiceRpcEntityContract {
  createEntity(data: CreateEntityRequestDto): Promise<EntityDto>
  getEntityById(data: EntityIdRequestDto): Promise<EntityDto | null>
  listEntities(data: ListEntitiesRequestDto): Promise<EntityListResponseDto>
  updateEntity(data: UpdateEntityRequestDto): Promise<EntityDto>
  deleteEntity(data: EntityIdRequestDto): Promise<void>
}

export interface IEntityServiceRpcOrganizationProfileContract {
  createOrganizationProfile(data: CreateOrganizationProfileRequestDto): Promise<OrganizationProfileDto>
  getOrganizationProfileByEntityId(data: EntityIdRequestDto): Promise<OrganizationProfileDto | null>
  updateOrganizationProfile(data: UpdateOrganizationProfileRequestDto): Promise<OrganizationProfileDto>
  deleteOrganizationProfile(data: EntityIdRequestDto): Promise<void>
}

export interface IEntityServiceRpcPersonProfileContract {
  createPersonProfile(data: CreatePersonProfileRequestDto): Promise<PersonProfileDto>
  getPersonProfileByEntityId(data: EntityIdRequestDto): Promise<PersonProfileDto | null>
  updatePersonProfile(data: UpdatePersonProfileRequestDto): Promise<PersonProfileDto>
  deletePersonProfile(data: EntityIdRequestDto): Promise<void>
}
