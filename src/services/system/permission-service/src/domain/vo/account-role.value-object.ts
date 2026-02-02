import { AccountType } from '../enums/account-type.enum'

export class AccountRole {
  constructor(
    private readonly accountType: AccountType,
    private readonly accountId: string,
    private readonly roleId: string,
    private readonly createdBy: string
  ) {}

  public getAccountType(): AccountType {
    return this.accountType
  }
  public getAccountId(): string {
    return this.accountId
  }
  public getRoleId(): string {
    return this.roleId
  }
  public getCreatedBy(): string {
    return this.createdBy
  }
}
