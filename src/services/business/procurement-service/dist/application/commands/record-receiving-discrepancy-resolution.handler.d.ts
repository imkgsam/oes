import { ICommandHandler } from '@nestjs/cqrs';
import { ReceivingExpectationRecord } from '../../domain/models/procurement-records';
import { ReceivingRepository } from '../../domain/repositories/receiving.repository';
import { RecordReceivingDiscrepancyResolutionCommand } from './record-receiving-discrepancy-resolution.command';
/** RecordReceivingDiscrepancyResolutionHandler records procurement-side discrepancy decisions without mutating inventory truth. */
export declare class RecordReceivingDiscrepancyResolutionHandler implements ICommandHandler<RecordReceivingDiscrepancyResolutionCommand, {
    receivingExpectation: ReceivingExpectationRecord;
    receivingDiscrepancy: NonNullable<ReceivingExpectationRecord['discrepancy']>;
}> {
    private readonly receivingRepository;
    constructor(receivingRepository: ReceivingRepository);
    execute(command: RecordReceivingDiscrepancyResolutionCommand): Promise<{
        receivingExpectation: ReceivingExpectationRecord;
        receivingDiscrepancy: NonNullable<ReceivingExpectationRecord['discrepancy']>;
    }>;
}
