export class User {
  constructor(
    public readonly id: number,
    public readonly username: string,
    private passwordHash: string
  ) { }

  async validatePassword(password: string, compareFunction: (a: string, b: string) => Promise<boolean>): Promise<boolean> {
    return compareFunction(password, this.passwordHash)
  }

  changePassword(newHash: string) {
    this.passwordHash = newHash
  }

}