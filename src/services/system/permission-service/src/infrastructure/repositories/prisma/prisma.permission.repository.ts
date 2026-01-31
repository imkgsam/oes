import { Injectable } from '@nestjs/common'
import { Permission } from 'src/domain/entities/permission.entity'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}
  findByAccountIdAndCode(accountId: string, code: string): Promise<Permission | null> {
    throw new Error('Method not implemented.')
  }
}
