import { OrganizationProfile } from '../entities'

export interface CreateOrganizationProfileData {
  entityId: string
  legalName?: string | null
  registrationNumber?: string | null
  taxId?: string | null
  country?: string | null
  website?: string | null
}

export interface UpdateOrganizationProfileData {
  legalName?: string | null
  registrationNumber?: string | null
  taxId?: string | null
  country?: string | null
  website?: string | null
}

export interface IOrganizationProfileRepository {
  create(data: CreateOrganizationProfileData): Promise<OrganizationProfile>
  findByEntityId(entityId: string): Promise<OrganizationProfile | null>
  findByRegistrationNumber(registrationNumber: string): Promise<OrganizationProfile | null>
  findByTaxId(taxId: string): Promise<OrganizationProfile | null>
  update(entityId: string, data: UpdateOrganizationProfileData): Promise<OrganizationProfile>
  delete(entityId: string): Promise<void>
}

export const ORGANIZATION_PROFILE_REPOSITORY = Symbol('IOrganizationProfileRepository')
