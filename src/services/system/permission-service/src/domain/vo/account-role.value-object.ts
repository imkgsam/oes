import { AccountType } from '../enums/account-type.enum'

/** Value object representing the binding between an account and a role */
export class AccountRole {
  constructor(
    public readonly accountType: AccountType,
    public readonly accountId: string,
    public readonly roleId: string,
    public readonly tenantId: string,
    public readonly createdBy: string
  ) {}
}
