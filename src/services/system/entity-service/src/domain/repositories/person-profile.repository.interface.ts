import { PersonProfile } from '../entities'

export interface CreatePersonProfileData {
  entityId: string
  gender?: string | null
  birthday?: Date | null
  idNumber?: string | null
  passportNumber?: string | null
}

export interface UpdatePersonProfileData {
  gender?: string | null
  birthday?: Date | null
  idNumber?: string | null
  passportNumber?: string | null
}

export interface IPersonProfileRepository {
  create(data: CreatePersonProfileData): Promise<PersonProfile>
  findByEntityId(entityId: string): Promise<PersonProfile | null>
  findByIdNumber(idNumber: string): Promise<PersonProfile | null>
  findByPassportNumber(passportNumber: string): Promise<PersonProfile | null>
  update(entityId: string, data: UpdatePersonProfileData): Promise<PersonProfile>
  delete(entityId: string): Promise<void>
}

export const PERSON_PROFILE_REPOSITORY = Symbol('IPersonProfileRepository')
