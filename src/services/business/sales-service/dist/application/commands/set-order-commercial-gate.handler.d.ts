import { ICommandHandler } from '@nestjs/cqrs';
import { SalesOrderRecord } from '../../domain/models/sales-records';
import { SalesOrderRepository } from '../../domain/repositories/sales-order.repository';
import { SetOrderCommercialGateCommand } from './set-order-commercial-gate.command';
/** SetOrderCommercialGateHandler updates one gate flag without collapsing the three execution gates together. */
export declare class SetOrderCommercialGateHandler implements ICommandHandler<SetOrderCommercialGateCommand, SalesOrderRecord> {
    private readonly salesOrderRepository;
    constructor(salesOrderRepository: SalesOrderRepository);
    execute(command: SetOrderCommercialGateCommand): Promise<SalesOrderRecord>;
}
