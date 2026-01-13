// File: src/common/interfaces/services/entity-service/rpc.contract.ts
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
} from '../../../dtos/entity-service/all.dto'

// RPC 接口入口
export interface IEntityServiceRpcContract
  extends IEntityServiceRpcEntityContract,
    IEntityServiceRpcPersonProfileContract,
    IEntityServiceRpcOrganizationProfileContract {}

// Entity RPC Contract
export interface IEntityServiceRpcEntityContract {
  createEntity(data: CreateEntityRequestDto): Promise<EntityDto>
  getEntityById(data: EntityIdRequestDto): Promise<EntityDto | null>
  listEntities(data: ListEntitiesRequestDto): Promise<EntityListResponseDto>
  updateEntity(data: UpdateEntityRequestDto): Promise<EntityDto>
  deleteEntity(data: EntityIdRequestDto): Promise<void>
}

// Person Profile RPC Contract
export interface IEntityServiceRpcPersonProfileContract {
  createPersonProfile(data: CreatePersonProfileRequestDto): Promise<PersonProfileDto>
  getPersonProfileByEntityId(data: EntityIdRequestDto): Promise<PersonProfileDto | null>
  updatePersonProfile(data: UpdatePersonProfileRequestDto): Promise<PersonProfileDto>
  deletePersonProfile(data: EntityIdRequestDto): Promise<void>
}

// Organization Profile RPC Contract
export interface IEntityServiceRpcOrganizationProfileContract {
  createOrganizationProfile(
    data: CreateOrganizationProfileRequestDto
  ): Promise<OrganizationProfileDto>
  getOrganizationProfileByEntityId(data: EntityIdRequestDto): Promise<OrganizationProfileDto | null>
  updateOrganizationProfile(
    data: UpdateOrganizationProfileRequestDto
  ): Promise<OrganizationProfileDto>
  deleteOrganizationProfile(data: EntityIdRequestDto): Promise<void>
}
