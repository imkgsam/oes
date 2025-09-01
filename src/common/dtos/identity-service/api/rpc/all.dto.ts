export interface UserInfo {
  id: string
  username: string
  email?: string
  phone?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED'
  createdAt: Date
  updatedAt: Date
}

export interface AccountInfo {
  id: string
  name: string
  type: 'PERSONAL' | 'BUSINESS' | 'ENTERPRISE'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED'
  createdAt: Date
  updatedAt: Date
}

export interface TenantInfo {
  id: string
  name: string
  code: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED'
  createdAt: Date
  updatedAt: Date
}

export interface UserAccountRelation {
  userId: string
  accountId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  joinedAt: Date
}

export interface AccountTenantRelation {
  accountId: string
  tenantId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  joinedAt: Date
}
