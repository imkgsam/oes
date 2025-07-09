import { Session } from '../../../../domain/entities/session.entity';
import { ISessionRepository } from '../../../../domain/repositories/session.repository';
export declare class RedisSessionRepository implements ISessionRepository {
    private redis;
    constructor();
    private getSessionKey;
    private getUserSessionsKey;
    save(session: Session): Promise<void>;
    findByUserIdAndSessionId(userId: string, sessionId: string): Promise<Session | null>;
    remove(userId: string, sessionId: string): Promise<void>;
    revoke(userId: string, sessionId: string): Promise<void>;
    revokeAll(userId: string): Promise<void>;
    findAllActiveByUserId(userId: string): Promise<Session[]>;
}
