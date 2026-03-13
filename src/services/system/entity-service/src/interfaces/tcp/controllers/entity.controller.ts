// File: src/services/system/entity-service/src/interfaces/tcp/controllers/entity.controller.ts
import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import {
  EntityDto,
  EntityIdRequestDto,
  CreateEntityRequestDto,
  UpdateEntityRequestDto,
  ListEntitiesRequestDto,
  EntityListResponseDto
} from '@oes/common/dtos'
import { IEntityServiceRpcEntityContract } from '@oes/common/interfaces'
import { ENTITY_MESSAGES } from '@oes/common/constants'
import { RpcRequestData } from '@oes/common/decorators'
import { EntityService } from '../../../application/services/entity.service'

@Controller()
export class EntityController implements IEntityServiceRpcEntityContract {
  constructor(private readonly entityService: EntityService) {}

  @MessagePattern(ENTITY_MESSAGES.CREATE_ENTITY)
  async createEntity(@RpcRequestData() data: CreateEntityRequestDto): Promise<EntityDto> {
    const entity = await this.entityService.createEntity({
      type: data.type,
      name: data.name,
      alias: data.alias,
      isActive: data.isActive,
      notes: data.notes
    })
    return entity.toJSON()
  }

  @MessagePattern(ENTITY_MESSAGES.GET_ENTITY_BY_ID)
  async getEntityById(@RpcRequestData() data: EntityIdRequestDto): Promise<EntityDto | null> {
    try {
      const entity = await this.entityService.getEntityById(data.entityId)
      return entity.toJSON()
    } catch {
      return null
    }
  }

  @MessagePattern(ENTITY_MESSAGES.LIST_ENTITIES)
  async listEntities(
    @RpcRequestData() data: ListEntitiesRequestDto
  ): Promise<EntityListResponseDto> {
    const [entities, total] = await Promise.all([
      this.entityService.getEntities({
        type: data.type,
        isActive: data.isActive,
        skip: data.skip,
        take: data.take ?? 20
      }),
      this.entityService.countEntities({
        type: data.type,
        isActive: data.isActive
      })
    ])

    return {
      entities: entities.map((entity) => entity.toJSON()),
      total
    }
  }

  @MessagePattern(ENTITY_MESSAGES.UPDATE_ENTITY)
  async updateEntity(@RpcRequestData() data: UpdateEntityRequestDto): Promise<EntityDto> {
    const entity = await this.entityService.updateEntity(data.entityId, {
      name: data.name,
      alias: data.alias,
      isActive: data.isActive,
      notes: data.notes
    })
    return entity.toJSON()
  }

  @MessagePattern(ENTITY_MESSAGES.DELETE_ENTITY)
  async deleteEntity(@RpcRequestData() data: EntityIdRequestDto): Promise<void> {
    await this.entityService.deleteEntity(data.entityId)
  }
}
