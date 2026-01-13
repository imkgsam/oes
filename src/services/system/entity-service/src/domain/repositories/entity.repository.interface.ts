import { Entity } from '../entities'
import { EntityType } from '../value-objects'

export interface CreateEntityData {
  type: EntityType
  name: string
  alias?: string | null
  isActive?: boolean
  notes?: string | null
}

export interface UpdateEntityData {
  name?: string
  alias?: string | null
  isActive?: boolean
  notes?: string | null
}

export interface FindEntitiesOptions {
  type?: EntityType
  isActive?: boolean
  skip?: number
  take?: number
}

export interface IEntityRepository {
  create(data: CreateEntityData): Promise<Entity>
  findById(id: string): Promise<Entity | null>
  findMany(options?: FindEntitiesOptions): Promise<Entity[]>
  update(id: string, data: UpdateEntityData): Promise<Entity>
  delete(id: string): Promise<void>
  count(options?: FindEntitiesOptions): Promise<number>
}

export const ENTITY_REPOSITORY = Symbol('IEntityRepository')
