import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { UserSummaryEntity } from '../../../domain/entities/user-summary.entity'
import { UserRepository } from '../../../domain/repositories/user.repository'
import { UserSummaryView } from './user-query.result'
import { GetUserByEmailQuery } from './get-user-by-email.query'

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler
  implements IQueryHandler<GetUserByEmailQuery, UserSummaryView | null>
{
  constructor(
    @Inject(SYMBOLS.REPO.USER)
    private readonly userRepository: UserRepository
  ) {}

  async execute(query: GetUserByEmailQuery): Promise<UserSummaryView | null> {
    const user = await this.userRepository.findByEmail(query.email)
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
