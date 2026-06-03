export interface IdentityUserSummary {
  userId: string
  email?: string
  phone?: string
  fullName?: string
}

export interface AccountCandidateSummary {
  accountId: string
  tenantId: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
  displayName?: string
}

export type PdaAccountCandidateSummary = AccountCandidateSummary

export interface IdentityAccountSummary extends AccountCandidateSummary {
  userId: string
  isEnabled: boolean
}

export interface EmployeeLoginAccountSummary extends IdentityAccountSummary {
  employeeId: string
}

export interface IIdentityServicePort {
  getUserById(userId: string): Promise<IdentityUserSummary | null>
  getUserByEmail(email: string): Promise<IdentityUserSummary | null>
  getUserByPhone(phone: string): Promise<IdentityUserSummary | null>
  getAvailableAccountsByUserId(userId: string): Promise<AccountCandidateSummary[]>
  getAccountById(accountId: string): Promise<IdentityAccountSummary | null>
  resolveEmployeeLoginAccount(input: {
    tenantId: string
    employeeId: string
  }): Promise<EmployeeLoginAccountSummary | null>
}
