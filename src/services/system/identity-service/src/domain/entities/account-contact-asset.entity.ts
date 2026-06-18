export type AccountContactAssetOwnership = 'COMPANY_CONTROLLED' | 'EMPLOYEE_OWNED'

export type AccountContactAssetStatus =
  | 'ACTIVE'
  | 'PENDING_HANDOVER'
  | 'DISABLED'
  | 'RELEASED'
  | 'REVOKED'

export type AccountContactAssetType =
  | 'WORK_EMAIL'
  | 'WORK_PHONE'
  | 'WECHAT'
  | 'WHATSAPP'
  | 'EXTERNAL_COMMUNICATION_ACCOUNT'
  | 'OTHER_SOCIAL'

// AccountContactAssetEntity represents identity-owned contact values assigned to an account context.
export class AccountContactAssetEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly accountId: string,
    public readonly userId: string | null,
    public readonly employeeId: string | null,
    public readonly type: AccountContactAssetType,
    public readonly provider: string | null,
    public readonly value: string,
    public readonly displayName: string | null,
    public readonly ownership: AccountContactAssetOwnership,
    public readonly usage: string[],
    public readonly status: AccountContactAssetStatus,
    public readonly isPrimary: boolean,
    public readonly assignedAt: Date,
    public readonly releasedAt: Date | null
  ) {}
}
