import { IQueryHandler } from '@nestjs/cqrs';
import { ReceivingRepository } from '../../domain/repositories/receiving.repository';
import { SearchReceivingExpectationsQuery } from './search-receiving-expectations.query';
/** SearchReceivingExpectationsHandler returns the procurement expectation page without mutating receiving truth. */
export declare class SearchReceivingExpectationsHandler implements IQueryHandler<SearchReceivingExpectationsQuery, {
    receivingExpectations: Awaited<ReturnType<ReceivingRepository['search']>>['items'];
    total: number;
    page: number;
    pageSize: number;
}> {
    private readonly receivingRepository;
    constructor(receivingRepository: ReceivingRepository);
    execute(query: SearchReceivingExpectationsQuery): Promise<{
        receivingExpectations: import("../../domain/models/procurement-records").ReceivingExpectationRecord[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
