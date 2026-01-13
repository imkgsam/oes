import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PersonProfile } from '../../domain/entities'
import {
  IPersonProfileRepository,
  CreatePersonProfileData,
  UpdatePersonProfileData
} from '../../domain/repositories'

@Injectable()
export class PersonProfileRepository implements IPersonProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePersonProfileData): Promise<PersonProfile> {
    const record = await this.prisma.personProfile.create({
      data: {
        entityId: data.entityId,
        gender: data.gender,
        birthday: data.birthday,
        idNumber: data.idNumber,
        passportNumber: data.passportNumber
      }
    })

    return this.mapToPersonProfile(record)
  }

  async findByEntityId(entityId: string): Promise<PersonProfile | null> {
    const record = await this.prisma.personProfile.findUnique({
      where: { entityId }
    })

    if (!record) {
      return null
    }

    return this.mapToPersonProfile(record)
  }

  async findByIdNumber(idNumber: string): Promise<PersonProfile | null> {
    const record = await this.prisma.personProfile.findUnique({
      where: { idNumber }
    })

    if (!record) {
      return null
    }

    return this.mapToPersonProfile(record)
  }

  async findByPassportNumber(passportNumber: string): Promise<PersonProfile | null> {
    const record = await this.prisma.personProfile.findUnique({
      where: { passportNumber }
    })

    if (!record) {
      return null
    }

    return this.mapToPersonProfile(record)
  }

  async update(entityId: string, data: UpdatePersonProfileData): Promise<PersonProfile> {
    const record = await this.prisma.personProfile.update({
      where: { entityId },
      data: {
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.birthday !== undefined && { birthday: data.birthday }),
        ...(data.idNumber !== undefined && { idNumber: data.idNumber }),
        ...(data.passportNumber !== undefined && { passportNumber: data.passportNumber })
      }
    })

    return this.mapToPersonProfile(record)
  }

  async delete(entityId: string): Promise<void> {
    await this.prisma.personProfile.delete({
      where: { entityId }
    })
  }

  private mapToPersonProfile(record: {
    id: string
    entityId: string
    gender: string | null
    birthday: Date | null
    idNumber: string | null
    passportNumber: string | null
    createdAt: Date
    updatedAt: Date
  }): PersonProfile {
    return PersonProfile.create({
      id: record.id,
      entityId: record.entityId,
      gender: record.gender,
      birthday: record.birthday,
      idNumber: record.idNumber,
      passportNumber: record.passportNumber,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    })
  }
}
