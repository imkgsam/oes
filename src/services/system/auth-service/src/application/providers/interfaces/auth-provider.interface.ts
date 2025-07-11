import { User } from 'src/domain/entities/user.entity'

export interface IAuthProvider<T = any> {
  authenticate(dto: T): Promise<User>
}
