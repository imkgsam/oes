export class UserDto {
  id: string
  email?: string
  phone?: string
  fullname: string
  createdAt: Date
  updatedAt: Date
}

export class AccountDto {
  id: string
  userId: string
  tenantId: string
  email?: string
  phone?: string
  isEnable: Boolean
  isAdmin: Boolean
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

export class UserIdRequestDto {
  userId: string
}
export class AccountIdRequestDto {
  accountId: string
}
export class EmailRequestDto {
  email: string
}
export class PhoneRequestDto {
  phone: string
}
