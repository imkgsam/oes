import { Injectable } from '@nestjs/common'
import { RoleRepository } from 'src/domain/repositories/role.repository'
import { CreateRoleDto } from '../dtos/role.dto'
import { Role } from 'src/domain/entities/role.entity'

@Injectable()
export class RoleService {
  constructor(private readonly roleRepo: RoleRepository) {}

  async create(dto: CreateRoleDto): Promise<void> {
    const role = new Role(crypto.randomUUID(), dto.name, dto.description, dto.module)
    await this.roleRepo.save(role)
  }

  async getById(id: string): Promise<Role | null> {
    return this.roleRepo.findById(id)
  }

  async getAll(): Promise<Role[]> {
    return this.roleRepo.findAll()
  }

  async delete(id: string): Promise<void> {
    await this.roleRepo.delete(id)
  }
}
