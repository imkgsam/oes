import { ICommandHandler } from '@nestjs/cqrs';
import { SalesOrderRecord } from '../../domain/models/sales-records';
import { SalesOrderRepository } from '../../domain/repositories/sales-order.repository';
import { SubmitFulfillmentHandoffCommand } from './submit-fulfillment-handoff.command';
/** SubmitFulfillmentHandoffHandler records sales-side handoff submission without changing any physical release truth. */
export declare class SubmitFulfillmentHandoffHandler implements ICommandHandler<SubmitFulfillmentHandoffCommand, SalesOrderRecord> {
    private readonly salesOrderRepository;
    constructor(salesOrderRepository: SalesOrderRepository);
    execute(command: SubmitFulfillmentHandoffCommand): Promise<SalesOrderRecord>;
}
