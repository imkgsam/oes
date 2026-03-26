import { Injectable } from '@nestjs/common'
import {
  MachinePrincipalScopeLevel,
  MachinePrincipalStatus,
  MachinePrincipalType,
  Prisma
} from '../../../../prisma/generated/prisma'
import { MACHINE_PRINCIPAL_STATUSES } from '../../../common/constants/machine-principal.constants'
import { ServiceAccountEntity } from '../../../domain/entities/service-account.entity'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { PrismaServiceAccountMapper } from '../../mappers/prisma-service-account.mapper'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaServiceAccountRepository implements ServiceAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(serviceAccountId: string): Promise<ServiceAccountEntity | null> {
    const record = await this.prisma.serviceAccount.findUnique({
      where: { id: serviceAccountId.trim() }
    })

    return record ? PrismaServiceAccountMapper.toDomain(record) : null
  }

  async list(input?: {
    tenantId?: string
    scopeLevel?: string
    type?: string
    status?: string
  }): Promise<ServiceAccountEntity[]> {
    const where: Prisma.ServiceAccountWhereInput = {}

    if (input?.tenantId) {
      where.tenantId = input.tenantId.trim()
    }

    if (input?.scopeLevel) {
      where.scopeLevel = MachinePrincipalScopeLevel[input.scopeLevel as keyof typeof MachinePrincipalScopeLevel]
    }

    if (input?.type) {
      where.type = MachinePrincipalType[input.type as keyof typeof MachinePrincipalType]
    }

    if (input?.status) {
      where.status = MachinePrincipalStatus[input.status as keyof typeof MachinePrincipalStatus]
    }

    const records = await this.prisma.serviceAccount.findMany({
      where,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
    })

    return records.map((record) => PrismaServiceAccountMapper.toDomain(record))
  }

  async create(input: {
    tenantId?: string
    scopeLevel: string
    type: string
    name: string
    description?: string
    createdBy?: string
  }): Promise<ServiceAccountEntity> {
    const record = await this.prisma.serviceAccount.create({
      data: PrismaServiceAccountMapper.toPersistent({
        tenantId: input.tenantId,
        scopeLevel: MachinePrincipalScopeLevel[
          input.scopeLevel as keyof typeof MachinePrincipalScopeLevel
        ],
        type: MachinePrincipalType[input.type as keyof typeof MachinePrincipalType],
        name: input.name.trim(),
        description: input.description,
        status: MachinePrincipalStatus.ACTIVE,
        createdBy: input.createdBy
      })
    })

    return PrismaServiceAccountMapper.toDomain(record)
  }

  async setStatus(input: {
    serviceAccountId: string
    status: string
    operatorId?: string
  }): Promise<ServiceAccountEntity> {
    const status = MachinePrincipalStatus[input.status as keyof typeof MachinePrincipalStatus]
    const disabledMetadata =
      input.status === MACHINE_PRINCIPAL_STATUSES.DISABLED
        ? {
            disabledAt: new Date(),
            disabledBy: input.operatorId ?? null
          }
        : {
            disabledAt: null,
            disabledBy: null
          }

    const record = await this.prisma.serviceAccount.update({
      where: { id: input.serviceAccountId },
      data: {
        status,
        ...disabledMetadata
      }
    })

    return PrismaServiceAccountMapper.toDomain(record)
  }
}
