import { ISessionRepository } from '../repositories/session.repository';
import { Session } from '../entities/session.entity';

export class SessionDomainService {
  constructor(private readonly sessionRepo: ISessionRepository) { }

  async createSession(session: Session): Promise<void> {
    await this.sessionRepo.save(session);
  }

  async getSession(userId: string, sessionId: string): Promise<Session | null> {
    return this.sessionRepo.findByUserIdAndSessionId(userId, sessionId);
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.sessionRepo.revoke(userId, sessionId);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.sessionRepo.revokeAll(userId);
  }

  async listActiveSessions(userId: string): Promise<Session[]> {
    return this.sessionRepo.findAllActiveByUserId(userId);
  }
}
