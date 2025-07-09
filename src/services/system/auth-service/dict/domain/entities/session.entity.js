"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
class Session {
    sessionId;
    userId;
    deviceId;
    accessToken;
    refreshToken;
    userAgent;
    ip;
    loginAt;
    lastActiveAt;
    status;
    constructor(sessionId, userId, deviceId, accessToken, refreshToken, userAgent, ip, loginAt, lastActiveAt, status = 'active') {
        this.sessionId = sessionId;
        this.userId = userId;
        this.deviceId = deviceId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userAgent = userAgent;
        this.ip = ip;
        this.loginAt = loginAt;
        this.lastActiveAt = lastActiveAt;
        this.status = status;
    }
    revoke() {
        this.status = 'revoked';
    }
    refreshTokens(accessToken, refreshToken) {
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
exports.Session = Session;
//# sourceMappingURL=session.entity.js.map