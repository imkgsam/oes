export interface UserDto {
  id: string
  email?: string
  phone?: string
  fullname: string
  createdAt: Date
  updatedAt: Date
}

export interface AccountDto {
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
