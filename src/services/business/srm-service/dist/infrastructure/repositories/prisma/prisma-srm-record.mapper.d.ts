import { SrmSupplierPartyBindingStatus as PrismaSupplierPartyBindingStatus, SrmSupplierOfferingStatus as PrismaSupplierOfferingStatus, SrmSupplierStatus as PrismaSupplierStatus, SupplierAddress as PrismaSupplierAddressRow, SupplierContact as PrismaSupplierContactRow, SupplierOffering as PrismaSupplierOfferingRow, Prisma } from '../../../../prisma/generated/prisma';
import { SupplierOfferingRecord, SupplierOfferingStatus, SupplierProfileRecord, SupplierAddressRecord, SupplierContactRecord, SupplierPartyBindingStatus, SupplierStatus } from '../../../domain/models/srm-records';
declare const supplierProfileInclude: {
    partyBinding: true;
};
export type SupplierProfileWithBinding = Prisma.SupplierProfileGetPayload<{
    include: typeof supplierProfileInclude;
}>;
/** PrismaSrmRecordMapper translates Prisma SRM persistence rows into the frozen phase 1 record shapes. */
export declare class PrismaSrmRecordMapper {
    /** supplierProfileIncludeValue exposes the canonical include graph for account repository round-trips. */
    static supplierProfileIncludeValue(): typeof supplierProfileInclude;
    /** toSupplierProfile converts one persisted SRM account and optional primary binding into the domain record shape. */
    static toSupplierProfile(record: SupplierProfileWithBinding): SupplierProfileRecord;
    /** toSupplierContact converts one persisted SRM contact row into the domain relationship record shape. */
    static toSupplierContact(record: PrismaSupplierContactRow): SupplierContactRecord;
    /** toSupplierAddress converts one persisted SRM address row into the domain relationship record shape. */
    static toSupplierAddress(record: PrismaSupplierAddressRow): SupplierAddressRecord;
    /** toSupplierOffering converts one persisted offering row into the current supplyability fact shape. */
    static toSupplierOffering(record: PrismaSupplierOfferingRow): SupplierOfferingRecord;
    /** toPersistedSupplierStatus converts the SRM domain status enum into the Prisma enum value. */
    static toPersistedSupplierStatus(status: SupplierStatus): PrismaSupplierStatus;
    /** toPersistedBindingStatus converts the SRM binding status enum into the Prisma enum value. */
    static toPersistedBindingStatus(status: SupplierPartyBindingStatus): PrismaSupplierPartyBindingStatus;
    /** toPersistedSupplierOfferingStatus converts the offering fact status enum into the Prisma enum value. */
    static toPersistedSupplierOfferingStatus(status: SupplierOfferingStatus): PrismaSupplierOfferingStatus;
    /** toInputJson deep-clones one plain SRM payload into a Prisma JSON input payload. */
    static toInputJson(value: unknown): Prisma.InputJsonValue;
    /** fromJson casts one stored JSON payload back into the snapshot shape used by the SRM records. */
    static fromJson<T>(value: Prisma.JsonValue): T;
    /** toDomainSupplierStatus maps the persisted SRM status enum into the domain status enum. */
    private static toDomainSupplierStatus;
    /** toDomainSupplierOfferingStatus maps the persisted offering status into the minimal domain status set. */
    private static toDomainSupplierOfferingStatus;
}
export {};
