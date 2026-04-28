import { ICommandHandler } from '@nestjs/cqrs';
import { SupplierProfileRecord } from '../../domain/models/srm-records';
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository';
import { TenantPartyLookupPort } from '../ports/tenant-party-lookup.port';
import { BindSupplierToTenantPartyCommand } from './bind-supplier-to-tenant-party.command';
/** BindSupplierToTenantPartyHandler enforces the phase 1 single formal tenant-party binding invariant. */
export declare class BindSupplierToTenantPartyHandler implements ICommandHandler<BindSupplierToTenantPartyCommand, SupplierProfileRecord> {
    private readonly profileRepository;
    private readonly tenantPartyLookup;
    constructor(profileRepository: SupplierProfileRepository, tenantPartyLookup: TenantPartyLookupPort);
    execute(command: BindSupplierToTenantPartyCommand): Promise<SupplierProfileRecord>;
}
