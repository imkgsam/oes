import { Inject, Injectable } from '@nestjs/common'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { CreatePermissionDto } from '../dtos/permission.dto'
import { Permission } from 'src/domain/entities/permission.entity'

@Injectable()
export class PermissionService {
  constructor(@Inject('PermissionRepository') private readonly permissionRepo: PermissionRepository) {}

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
