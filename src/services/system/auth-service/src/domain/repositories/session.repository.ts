import { Session } from '../entities/session.entity';

export interface ISessionRepository {
  save(session: Session): Promise<void>;
  findByUserIdAndSessionId(userId: string, sessionId: string): Promise<Session | null>;
  remove(userId: string, sessionId: string): Promise<void>;
  findAllActiveByUserId(userId: string): Promise<Session[]>;
  revoke(userId: string, sessionId: string): Promise<void>;
  revokeAll(userId: string): Promise<void>;
}
