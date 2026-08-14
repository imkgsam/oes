import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { ReceivingExpectationRecord } from '../../domain/models/procurement-records'
import { ReceivingRepository } from '../../domain/repositories/receiving.repository'
import { assertExists, assertRequiredString } from '../support/procurement-assertions'
import { ResolveReceivingExpectationForReceiptQuery } from './resolve-receiving-expectation-for-receipt.query'

/** Resolves only the tenant-visible Procurement expectation needed by WMS receipt validation. */
@Injectable()
@QueryHandler(ResolveReceivingExpectationForReceiptQuery)
export class ResolveReceivingExpectationForReceiptHandler implements IQueryHandler<
  ResolveReceivingExpectationForReceiptQuery,
  ReceivingExpectationRecord
> {
  constructor(
    @Inject(TOKENS.RECEIVING_REPOSITORY)
    private readonly receivingRepository: ReceivingRepository
  ) {}

  async execute(
    query: ResolveReceivingExpectationForReceiptQuery
  ): Promise<ReceivingExpectationRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.receivingExpectationId, 'receivingExpectationId')
    return assertExists(
      await this.receivingRepository.findById(query.tenantId, query.receivingExpectationId),
      'receiving_expectation',
      query.receivingExpectationId
    )
  }
}
