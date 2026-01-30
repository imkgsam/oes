import { Inject, Injectable } from '@nestjs/common'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { CreatePermissionDto } from '../dtos/permission.dto'
import { Permission } from 'src/domain/entities/permission.entity'
import {
  PermissionCheckOutput,
  PermissionCheckPort,
  PermissionCheckInput
} from '@oes/common/contracts/permission-service/permission-check.port'

@Injectable()
export class PermissionService implements PermissionCheckPort {
  constructor(
    @Inject('PermissionRepository')
    private readonly permissionRepo: PermissionRepository
  ) {}

  async checkAccountPermission(input: PermissionCheckInput): Promise<PermissionCheckOutput> {
    throw new Error('Method not implemented.')
  }
  async checkAccountPermissionScope(input: PermissionCheckInput): Promise<PermissionCheckOutput> {
    throw new Error('Method not implemented.')
  }

  async create(dto: CreatePermissionDto): Promise<Permission> {
    const permission = new Permission(crypto.randomUUID(), dto.code, dto.module, dto.description)
    return this.permissionRepo.create(permission)
  }

  async getByCode(code: string): Promise<Permission | null> {
    return this.permissionRepo.findByCode(code)
  }

  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepo.findAll()
  }

  async getAllByModule(module: string): Promise<Permission[]> {
    return this.permissionRepo.findAllByModule(module)
  }

  async delete(id: string): Promise<Permission | null> {
    return this.permissionRepo.delete(id)
  }
}
