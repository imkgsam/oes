import { User } from '../entities/credential.entity'

export interface ICredentialRepository {
  findByEmail(email: string): Promise<User | null>
  findByPhone(phone: string): Promise<User | null>
  findByGoogleId(googleId: string): Promise<User | null>
  findByWechatOpenId(wechatOpenId: string): Promise<User | null>
  findByFields(fields: Partial<User>): Promise<User | null>
  create(user: Partial<User>): Promise<User>
  findAll(): Promise<User[]>
}
