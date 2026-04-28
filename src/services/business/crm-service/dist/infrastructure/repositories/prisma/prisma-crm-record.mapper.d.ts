import { CrmCustomerPartyBindingStatus as PrismaCustomerPartyBindingStatus, CrmCustomerStatus as PrismaCustomerStatus, CustomerAddress as PrismaCustomerAddressRow, CustomerContact as PrismaCustomerContactRow, Prisma } from '../../../../prisma/generated/prisma';
import { CustomerAccountRecord, CustomerAddressRecord, CustomerContactRecord, CustomerPartyBindingStatus, CustomerStatus } from '../../../domain/models/crm-records';
declare const customerAccountInclude: {
    primaryBinding: true;
};
export type CustomerAccountWithBinding = Prisma.CustomerAccountGetPayload<{
    include: typeof customerAccountInclude;
}>;
/** PrismaCrmRecordMapper translates Prisma CRM persistence rows into the frozen phase 1 record shapes. */
export declare class PrismaCrmRecordMapper {
    /** customerAccountIncludeValue exposes the canonical include graph for account repository round-trips. */
    static customerAccountIncludeValue(): typeof customerAccountInclude;
    /** toCustomerAccount converts one persisted CRM account and optional primary binding into the domain record shape. */
    static toCustomerAccount(record: CustomerAccountWithBinding): CustomerAccountRecord;
    /** toCustomerContact converts one persisted CRM contact row into the domain relationship record shape. */
    static toCustomerContact(record: PrismaCustomerContactRow): CustomerContactRecord;
    /** toCustomerAddress converts one persisted CRM address row into the domain relationship record shape. */
    static toCustomerAddress(record: PrismaCustomerAddressRow): CustomerAddressRecord;
    /** toPersistedCustomerStatus converts the CRM domain status enum into the Prisma enum value. */
    static toPersistedCustomerStatus(status: CustomerStatus): PrismaCustomerStatus;
    /** toPersistedBindingStatus converts the CRM binding status enum into the Prisma enum value. */
    static toPersistedBindingStatus(status: CustomerPartyBindingStatus): PrismaCustomerPartyBindingStatus;
    /** toInputJson deep-clones one plain CRM payload into a Prisma JSON input payload. */
    static toInputJson(value: unknown): Prisma.InputJsonValue;
    /** fromJson casts one stored JSON payload back into the snapshot shape used by the CRM records. */
    static fromJson<T>(value: Prisma.JsonValue): T;
    /** toDomainCustomerStatus maps the persisted CRM status enum into the domain status enum. */
    private static toDomainCustomerStatus;
}
export {};
