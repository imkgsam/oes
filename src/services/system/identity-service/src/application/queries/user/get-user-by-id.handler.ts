import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { UserSummaryEntity } from '../../../domain/entities/user-summary.entity'
import { UserRepository } from '../../../domain/repositories/user.repository'
import { GetUserByIdQuery } from './get-user-by-id.query'

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.USER)
    private readonly userRepository: UserRepository
  ) {}

  execute(query: GetUserByIdQuery): Promise<UserSummaryEntity | null> {
    return this.userRepository.findById(query.userId)
  }
}
