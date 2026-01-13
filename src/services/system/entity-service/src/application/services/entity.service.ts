import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common'
import { Entity } from '../../domain/entities'
import { EntityType } from '../../domain/value-objects'
import {
  IEntityRepository,
  ENTITY_REPOSITORY,
  CreateEntityData,
  UpdateEntityData,
  FindEntitiesOptions
} from '../../domain/repositories'

@Injectable()
export class EntityService {
  constructor(
    @Inject(ENTITY_REPOSITORY)
    private readonly entityRepository: IEntityRepository
  ) {}

  async createEntity(data: CreateEntityData): Promise<Entity> {
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException('Entity name is required')
    }

    if (!data.type || !Object.values(EntityType).includes(data.type)) {
      throw new BadRequestException('Valid entity type is required')
    }

    return this.entityRepository.create({
      ...data,
      name: data.name.trim(),
      alias: data.alias?.trim() || null,
      isActive: data.isActive ?? true
    })
  }

  async getEntityById(id: string): Promise<Entity> {
    const entity = await this.entityRepository.findById(id)
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`)
    }
    return entity
  }

  async getEntities(options?: FindEntitiesOptions): Promise<Entity[]> {
    return this.entityRepository.findMany(options)
  }

  async updateEntity(id: string, data: UpdateEntityData): Promise<Entity> {
    const entity = await this.entityRepository.findById(id)
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`)
    }

    const updateData: UpdateEntityData = {}

    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        throw new BadRequestException('Entity name cannot be empty')
      }
      updateData.name = data.name.trim()
    }

    if (data.alias !== undefined) {
      updateData.alias = data.alias?.trim() || null
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes
    }

    return this.entityRepository.update(id, updateData)
  }

  async deleteEntity(id: string): Promise<void> {
    const entity = await this.entityRepository.findById(id)
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`)
    }
    await this.entityRepository.delete(id)
  }

  async countEntities(options?: FindEntitiesOptions): Promise<number> {
    return this.entityRepository.count(options)
  }
}
