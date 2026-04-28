import { IQueryHandler } from '@nestjs/cqrs';
import { SupplierProfileRecord } from '../../domain/models/srm-records';
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository';
import { GetSupplierQuery } from './get-supplier.query';
/** GetSupplierHandler loads one SRM supplier-profile shell and its active primary binding summary. */
export declare class GetSupplierHandler implements IQueryHandler<GetSupplierQuery, SupplierProfileRecord> {
    private readonly accountRepository;
    constructor(accountRepository: SupplierProfileRepository);
    execute(query: GetSupplierQuery): Promise<SupplierProfileRecord>;
}
