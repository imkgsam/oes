import { ISessionRepository } from '../repositories/session.repository';
import { Session } from '../entities/session.entity';
export declare class SessionDomainService {
    private readonly sessionRepo;
    constructor(sessionRepo: ISessionRepository);
    createSession(session: Session): Promise<void>;
    getSession(userId: string, sessionId: string): Promise<Session | null>;
    revokeSession(userId: string, sessionId: string): Promise<void>;
    revokeAllSessions(userId: string): Promise<void>;
    listActiveSessions(userId: string): Promise<Session[]>;
}
