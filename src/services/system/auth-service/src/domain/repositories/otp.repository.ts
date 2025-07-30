import { OneTimeToken } from '../entities/otp.entity'

export interface ICredentialRepository {
  create(otp: Partial<OneTimeToken>): Promise<OneTimeToken>
  findAll(): Promise<OneTimeToken[]>
  save(otp: OneTimeToken): Promise<OneTimeToken>
  findOneById(id: string): Promise<OneTimeToken | null>
  delete(id: string): Promise<OneTimeToken | null>
}
