import { Injectable } from '@nestjs/common'
import { RoleRepository } from 'src/domain/repositories/role.repository'
import { CreateRoleDto } from '../dtos/role.dto'
import { Role } from 'src/domain/entities/role.entity'

@Injectable()
export class RoleService {
  constructor(private readonly roleRepo: RoleRepository) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const role = new Role(crypto.randomUUID(), dto.name, dto.module, dto.description)
    return this.roleRepo.save(role)
  }

  async getById(id: string): Promise<Role | null> {
    return this.roleRepo.findById(id)
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roleRepo.findAll()
  }

  async delete(id: string): Promise<Role | null> {
    return this.roleRepo.delete(id)
  }
}
