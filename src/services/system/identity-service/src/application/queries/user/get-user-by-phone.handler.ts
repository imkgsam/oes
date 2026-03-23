import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { UserSummaryEntity } from '../../../domain/entities/user-summary.entity'
import { UserRepository } from '../../../domain/repositories/user.repository'
import { GetUserByPhoneQuery } from './get-user-by-phone.query'

@QueryHandler(GetUserByPhoneQuery)
export class GetUserByPhoneHandler implements IQueryHandler<GetUserByPhoneQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.USER)
    private readonly userRepository: UserRepository
  ) {}

  execute(query: GetUserByPhoneQuery): Promise<UserSummaryEntity | null> {
    return this.userRepository.findByPhone(query.phone)
  }
}
