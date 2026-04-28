import { IQueryHandler } from '@nestjs/cqrs';
import { ReceivingExpectationRecord } from '../../domain/models/procurement-records';
import { ReceivingRepository } from '../../domain/repositories/receiving.repository';
import { GetReceivingExpectationQuery } from './get-receiving-expectation.query';
/** GetReceivingExpectationHandler loads one procurement expectation summary without mutating receiving truth. */
export declare class GetReceivingExpectationHandler implements IQueryHandler<GetReceivingExpectationQuery, ReceivingExpectationRecord> {
    private readonly receivingRepository;
    constructor(receivingRepository: ReceivingRepository);
    execute(query: GetReceivingExpectationQuery): Promise<ReceivingExpectationRecord>;
}
