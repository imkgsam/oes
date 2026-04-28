import { ICommandHandler } from '@nestjs/cqrs';
import { SupplierProfileRecord } from '../../domain/models/srm-records';
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository';
import { CreateSupplierProfileCommand } from './create-supplier-profile.command';
/** CreateSupplierProfileHandler creates one SRM supplier-profile shell without creating or mutating Party truth. */
export declare class CreateSupplierProfileHandler implements ICommandHandler<CreateSupplierProfileCommand, SupplierProfileRecord> {
    private readonly profileRepository;
    constructor(profileRepository: SupplierProfileRepository);
    execute(command: CreateSupplierProfileCommand): Promise<SupplierProfileRecord>;
}
