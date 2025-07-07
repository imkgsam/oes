export class Session {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public deviceId: string,
    public accessToken: string,
    public refreshToken: string,
    public userAgent: string,
    public ip: string,
    public loginAt: Date,
    public lastActiveAt: Date,
    public status: 'active' | 'revoked' = 'active',
  ) { }

  revoke() {
    this.status = 'revoked';
  }

  refreshTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.lastActiveAt = new Date();
  }

  touch() {
    this.lastActiveAt = new Date();
  }

  isActive() {
    return this.status === 'active';
  }
}
