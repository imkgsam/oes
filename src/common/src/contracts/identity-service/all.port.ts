// File: src/common/contracts/identity-service/all.port.ts
import {
  UserDto,
  AccountDto,
  UserIdRequestDto,
  AccountIdRequestDto
} from '../../dtos/identity-service/all.dto'

export interface AccountPort {
  getAccountsByUserId(data: UserIdRequestDto): Promise<AccountDto[]>
  getAccountById(data: AccountIdRequestDto): Promise<AccountDto | null>
}

export interface UserPort {
  getUserById(data: UserIdRequestDto): Promise<UserDto | null>
  getUserByEmail(email: string): Promise<UserDto | null>
  getUserByPhone(phone: string): Promise<UserDto | null>
}
