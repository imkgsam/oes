import { ICommandHandler } from '@nestjs/cqrs';
import { SupplierAddressRecord } from '../../domain/models/srm-records';
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository';
import { SupplierAddressRepository } from '../../domain/repositories/supplier-address.repository';
import { UpsertSupplierAddressCommand } from './upsert-supplier-address.command';
/** UpsertSupplierAddressHandler persists SRM business-address records without claiming Party address truth. */
export declare class UpsertSupplierAddressHandler implements ICommandHandler<UpsertSupplierAddressCommand, SupplierAddressRecord> {
    private readonly accountRepository;
    private readonly addressRepository;
    constructor(accountRepository: SupplierProfileRepository, addressRepository: SupplierAddressRepository);
    execute(command: UpsertSupplierAddressCommand): Promise<SupplierAddressRecord>;
}
