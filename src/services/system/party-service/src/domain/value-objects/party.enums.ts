/** PartyType distinguishes natural persons and legal organizations in the party master model. */
export enum PartyType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION'
}

/** PartyStatus tracks the lifecycle of the canonical party record. */
export enum PartyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MERGED = 'MERGED',
  ARCHIVED = 'ARCHIVED'
}

/** TenantPartyStatus tracks whether a tenant-scoped binding is active for business use. */
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

/** AssertionLevel distinguishes declared relationships from externally or operationally verified ones. */
export enum AssertionLevel {
  DECLARED = 'DECLARED',
  VERIFIED = 'VERIFIED'
}

/** RelationshipType captures the narrow first-stage stable party relationships allowed in party-service. */
export enum RelationshipType {
  SUBSIDIARY_OF = 'SUBSIDIARY_OF',
  BRANCH_OF = 'BRANCH_OF',
  LEGAL_REPRESENTATIVE_OF = 'LEGAL_REPRESENTATIVE_OF',
  SHAREHOLDER_OF = 'SHAREHOLDER_OF'
}
