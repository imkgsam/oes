import { Injectable } from '@nestjs/common'
import { AddUserScopeDto } from '../dtos/scope.dto'
import { UserScopeService } from '../services/user-scope.service'

@Injectable()
export class AddUserScopeUseCase {
  constructor(private readonly service: UserScopeService) {}
  async execute(dto: AddUserScopeDto): Promise<void> {
    await this.service.addScope(dto)
  }
}

@Injectable()
export class RemoveUserScopeUseCase {
  constructor(private readonly service: UserScopeService) {}
  async execute(scopeId: string): Promise<void> {
    await this.service.removeScope(scopeId)
  }
}
