import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { ReceivingExpectationRecord } from '../../domain/models/procurement-records'
import { ReceivingRepository } from '../../domain/repositories/receiving.repository'
import { assertExists, assertRequiredString } from '../support/procurement-assertions'
import { GetReceivingExpectationQuery } from './get-receiving-expectation.query'

/** GetReceivingExpectationHandler loads one procurement expectation summary without mutating receiving truth. */
@Injectable()
@QueryHandler(GetReceivingExpectationQuery)
export class GetReceivingExpectationHandler
  implements IQueryHandler<GetReceivingExpectationQuery, ReceivingExpectationRecord>
{
  constructor(
    @Inject(TOKENS.RECEIVING_REPOSITORY)
    private readonly receivingRepository: ReceivingRepository
  ) {}

  async execute(query: GetReceivingExpectationQuery): Promise<ReceivingExpectationRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.receivingExpectationId, 'receivingExpectationId')
    return assertExists(
      await this.receivingRepository.findById(query.tenantId, query.receivingExpectationId),
      'receiving_expectation',
      query.receivingExpectationId
    )
  }
}
