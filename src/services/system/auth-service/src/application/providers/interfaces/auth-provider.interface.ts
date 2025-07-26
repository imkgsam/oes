import { User } from 'src/domain/entities/credential.entity'

export interface IAuthProvider<T = any> {
  authenticate(dto: T): Promise<User>
}
