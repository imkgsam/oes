export interface UserDto {
  id: string
  email?: string
  phone?: string
  fullname: string
  createdAt: Date
  updatedAt: Date
}

export interface AccountDto {
  id: String
  userId: String
  tenantId: String
  email?: String
  phone?: String
  isEnable: Boolean
  isAdmin: Boolean
  avatarUrl?: String
  createdAt: Date
  updatedAt: Date
}
