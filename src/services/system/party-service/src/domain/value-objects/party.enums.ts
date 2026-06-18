/** PartyType distinguishes natural persons and organizations on a tenant-scoped TenantParty record. */
export enum PartyType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION'
}

/** TenantPartyStatus tracks whether a tenant-scoped subject record is active for business use. */
export enum TenantPartyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

/** IdentifierStatus expresses whether a party identifier is only declared or already verified. */
export enum IdentifierStatus {
  DECLARED = 'DECLARED',
  VERIFIED = 'VERIFIED',
  INVALID = 'INVALID',
  EXPIRED = 'EXPIRED'
}
