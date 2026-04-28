import { ICommandHandler } from '@nestjs/cqrs';
import { SupplierContactRecord } from '../../domain/models/srm-records';
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository';
import { SupplierContactRepository } from '../../domain/repositories/supplier-contact.repository';
import { UpsertSupplierContactCommand } from './upsert-supplier-contact.command';
/** UpsertSupplierContactHandler persists SRM business-contact records without turning them into Party truth. */
export declare class UpsertSupplierContactHandler implements ICommandHandler<UpsertSupplierContactCommand, SupplierContactRecord> {
    private readonly accountRepository;
    private readonly contactRepository;
    constructor(accountRepository: SupplierProfileRepository, contactRepository: SupplierContactRepository);
    execute(command: UpsertSupplierContactCommand): Promise<SupplierContactRecord>;
}
