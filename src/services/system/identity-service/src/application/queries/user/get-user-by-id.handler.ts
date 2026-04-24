import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { UserSummaryEntity } from '../../../domain/entities/user-summary.entity'
import { UserRepository } from '../../../domain/repositories/user.repository'
import { UserSummaryView } from './user-query.result'
import { GetUserByIdQuery } from './get-user-by-id.query'

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery, UserSummaryView | null> {
  constructor(
    @Inject(SYMBOLS.REPO.USER)
    private readonly userRepository: UserRepository
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserSummaryView | null> {
    const user = await this.userRepository.findById(query.userId)
    return user ? toUserSummaryView(user) : null
  }
}

function toUserSummaryView(user: UserSummaryEntity): UserSummaryView {
  return {
    id: user.id,
    partyId: user.partyId,
    username: user.username,
    personalEmail: user.personalEmail,
    personalPhone: user.personalPhone,
    isActive: user.isActive
  }
}
