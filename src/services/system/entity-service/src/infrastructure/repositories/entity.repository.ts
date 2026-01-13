import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Entity } from '../../domain/entities'
import { EntityType } from '../../domain/value-objects'
import {
  IEntityRepository,
  CreateEntityData,
  UpdateEntityData,
  FindEntitiesOptions
} from '../../domain/repositories'

@Injectable()
export class EntityRepository implements IEntityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEntityData): Promise<Entity> {
    const record = await this.prisma.entity.create({
      data: {
        type: data.type,
        name: data.name,
        alias: data.alias,
        isActive: data.isActive ?? true,
        notes: data.notes
      }
    })

    return this.mapToEntity(record)
  }

  async findById(id: string): Promise<Entity | null> {
    const record = await this.prisma.entity.findUnique({
      where: { id }
    })

    if (!record) {
      return null
    }

    return this.mapToEntity(record)
  }

  async findMany(options?: FindEntitiesOptions): Promise<Entity[]> {
    const where: Record<string, unknown> = {}

    if (options?.type) {
      where.type = options.type
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive
    }

    const records = await this.prisma.entity.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' }
    })

    return records.map((record) => this.mapToEntity(record))
  }

  async update(id: string, data: UpdateEntityData): Promise<Entity> {
    const record = await this.prisma.entity.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.alias !== undefined && { alias: data.alias }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.notes !== undefined && { notes: data.notes })
      }
    })

    return this.mapToEntity(record)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.entity.delete({
      where: { id }
    })
  }

  async count(options?: FindEntitiesOptions): Promise<number> {
    const where: Record<string, unknown> = {}

    if (options?.type) {
      where.type = options.type
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive
    }

    return this.prisma.entity.count({ where })
  }

  private mapToEntity(record: {
    id: string
    type: string
    name: string
    alias: string | null
    isActive: boolean
    notes: string | null
    createdAt: Date
    updatedAt: Date
  }): Entity {
    return Entity.create({
      id: record.id,
      type: record.type as EntityType,
      name: record.name,
      alias: record.alias,
      isActive: record.isActive,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    })
  }
}
