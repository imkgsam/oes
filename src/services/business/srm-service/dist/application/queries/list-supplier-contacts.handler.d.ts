import { IQueryHandler } from '@nestjs/cqrs';
import { SupplierContactRecord } from '../../domain/models/srm-records';
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository';
import { SupplierContactRepository } from '../../domain/repositories/supplier-contact.repository';
import { ListSupplierContactsQuery } from './list-supplier-contacts.query';
export interface ListSupplierContactsResult {
    contacts: SupplierContactRecord[];
}
/** ListSupplierContactsHandler returns SRM business-contact records for one existing supplier profile. */
export declare class ListSupplierContactsHandler implements IQueryHandler<ListSupplierContactsQuery, ListSupplierContactsResult> {
    private readonly accountRepository;
    private readonly contactRepository;
    constructor(accountRepository: SupplierProfileRepository, contactRepository: SupplierContactRepository);
    execute(query: ListSupplierContactsQuery): Promise<ListSupplierContactsResult>;
}
