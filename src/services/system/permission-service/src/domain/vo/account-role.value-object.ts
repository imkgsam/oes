import { AccountType } from '../enums/account-type.enum'
export class AccountRole {
  constructor(
    public readonly accountType: AccountType,
    public readonly accountId: string,
    public readonly roleId: string,
    public readonly createdBy: string
  ) {}
}
