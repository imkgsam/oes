import { Inject, Injectable } from '@nestjs/common'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { CreatePermissionDto } from '../dtos/permission.dto'
import { Permission } from 'src/domain/aggregates/permission.aggregate'

@Injectable()
export class PermissionService {
  constructor(
    @Inject('PermissionRepository')
    private readonly permissionRepo: PermissionRepository
  ) {}
  async createPermission(dto: CreatePermissionDto): Promise<Permission> {
  
}
