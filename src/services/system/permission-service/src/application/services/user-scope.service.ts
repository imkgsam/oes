// application/services/user-scope.service.ts
import { Injectable } from '@nestjs/common'
import { UserScopeRepository } from 'src/domain/repositories/user-scope.repository'
import { UserScope } from 'src/domain/entities/user-scope.entity'
import { AddUserScopeDto } from '../dtos/scope.dto'
import { ScopeResourceType } from 'src/domain/enums/scope-resource-type.enum'

@Injectable()
export class UserScopeService {
  constructor(private readonly repo: UserScopeRepository) {}

  async addScope(dto: AddUserScopeDto): Promise<void> {
    await this.repo.add(
      new UserScope(
        crypto.randomUUID(),
        dto.userId,
        dto.permissionCode,
        dto.resourceType as ScopeResourceType,
        dto.resourceId,
      ),
    )
  }

  async removeScope(id: string): Promise<void> {
    await this.repo.remove(id)
  }
}
