import { ICommandHandler } from '@nestjs/cqrs';
import { SupplierProfileRecord } from '../../domain/models/srm-records';
import { SupplierOfferingRepository } from '../../domain/repositories/supplier-offering.repository';
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository';
import { TenantPartyLookupPort } from '../ports/tenant-party-lookup.port';
import { ChangeSupplierStatusCommand } from './change-supplier-status.command';
/** ChangeSupplierStatusHandler updates only the SRM supplier status while keeping binding ownership unchanged. */
export declare class ChangeSupplierStatusHandler implements ICommandHandler<ChangeSupplierStatusCommand, SupplierProfileRecord> {
    private readonly profileRepository;
    private readonly offeringRepository;
    private readonly tenantPartyLookup;
    constructor(profileRepository: SupplierProfileRepository, offeringRepository: SupplierOfferingRepository, tenantPartyLookup: TenantPartyLookupPort);
    execute(command: ChangeSupplierStatusCommand): Promise<SupplierProfileRecord>;
}
