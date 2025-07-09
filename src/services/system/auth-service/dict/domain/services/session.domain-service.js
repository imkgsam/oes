"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionDomainService = void 0;
class SessionDomainService {
    sessionRepo;
    constructor(sessionRepo) {
        this.sessionRepo = sessionRepo;
    }
    async createSession(session) {
        await this.sessionRepo.save(session);
    }
    async getSession(userId, sessionId) {
        return this.sessionRepo.findByUserIdAndSessionId(userId, sessionId);
    }
    async revokeSession(userId, sessionId) {
        await this.sessionRepo.revoke(userId, sessionId);
    }
    async revokeAllSessions(userId) {
        await this.sessionRepo.revokeAll(userId);
    }
    async listActiveSessions(userId) {
        return this.sessionRepo.findAllActiveByUserId(userId);
    }
}
exports.SessionDomainService = SessionDomainService;
//# sourceMappingURL=session.domain-service.js.map