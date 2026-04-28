import { ICommandHandler } from '@nestjs/cqrs';
import { SalesOrderRecord } from '../../domain/models/sales-records';
import { QuoteVersionRepository } from '../../domain/repositories/quote-version.repository';
import { SalesOrderRepository } from '../../domain/repositories/sales-order.repository';
import { ConvertQuoteVersionToOrderCommand } from './convert-quote-version-to-order.command';
/** ConvertQuoteVersionToOrderHandler establishes exactly one sales order from one published quote version. */
export declare class ConvertQuoteVersionToOrderHandler implements ICommandHandler<ConvertQuoteVersionToOrderCommand, SalesOrderRecord> {
    private readonly quoteVersionRepository;
    private readonly salesOrderRepository;
    constructor(quoteVersionRepository: QuoteVersionRepository, salesOrderRepository: SalesOrderRepository);
    execute(command: ConvertQuoteVersionToOrderCommand): Promise<SalesOrderRecord>;
}
