import { ICommandHandler } from '@nestjs/cqrs';
import { SupplierProfileRecord } from '../../domain/models/srm-records';
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository';
import { UpdateSupplierProfileBasicsCommand } from './update-supplier-profile-basics.command';
/** UpdateSupplierProfileBasicsHandler updates phase 1 SRM supplier-profile basics without touching status or binding. */
export declare class UpdateSupplierProfileBasicsHandler implements ICommandHandler<UpdateSupplierProfileBasicsCommand, SupplierProfileRecord> {
    private readonly accountRepository;
    constructor(accountRepository: SupplierProfileRepository);
    execute(command: UpdateSupplierProfileBasicsCommand): Promise<SupplierProfileRecord>;
}
