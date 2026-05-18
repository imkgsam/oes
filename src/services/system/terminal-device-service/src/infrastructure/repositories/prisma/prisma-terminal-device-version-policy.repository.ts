import { Injectable } from '@nestjs/common'
import { TerminalDeviceVersionPolicyEntity } from '../../../domain/entities/terminal-device-version-policy.entity'
import { TerminalDeviceType } from '../../../domain/enums/terminal-device.enums'
import { TerminalDeviceVersionPolicyRepository } from '../../../domain/repositories/terminal-device-version-policy.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaTerminalDeviceMapper } from './prisma-terminal-device.mapper'

// PrismaTerminalDeviceVersionPolicyRepository persists tenant terminal app version policies.
@Injectable()
export class PrismaTerminalDeviceVersionPolicyRepository implements TerminalDeviceVersionPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Creates or replaces one tenant and terminal-type version policy.
  async upsert(entity: TerminalDeviceVersionPolicyEntity): Promise<TerminalDeviceVersionPolicyEntity> {
    const data = PrismaTerminalDeviceMapper.toVersionPolicyData(entity) as any
    const record = await this.prisma.terminalDeviceVersionPolicy.upsert({
      where: {
        tenantId_terminalDeviceType: {
          tenantId: entity.tenantId,
          terminalDeviceType: entity.terminalDeviceType
        }
      },
      update: data,
      create: data
    })
    return PrismaTerminalDeviceMapper.toVersionPolicyEntity(record)
  }

  // Loads one version policy by tenant and terminal device type.
  async findByTenantAndType(tenantId: string, terminalDeviceType: TerminalDeviceType): Promise<TerminalDeviceVersionPolicyEntity | null> {
    const record = await this.prisma.terminalDeviceVersionPolicy.findUnique({
      where: {
        tenantId_terminalDeviceType: {
          tenantId,
          terminalDeviceType
        }
      }
    })
    return record ? PrismaTerminalDeviceMapper.toVersionPolicyEntity(record) : null
  }
}
