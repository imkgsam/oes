import Redis from 'ioredis';
import { Session } from '../../../../domain/entities/session.entity';
import { ISessionRepository } from '../../../../domain/repositories/session.repository';

export class RedisSessionRepository implements ISessionRepository {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({ host: 'localhost', port: 6379 });
  }

  private getSessionKey(userId: string, sessionId: string) {
    return `session:${userId}:${sessionId}`;
  }
  private getUserSessionsKey(userId: string) {
    return `sessions:${userId}`;
  }

  async save(session: Session): Promise<void> {
    const key = this.getSessionKey(session.userId, session.sessionId);
    await this.redis.set(key, JSON.stringify(session), 'EX', 60 * 60 * 24 * 7);
    await this.redis.sadd(this.getUserSessionsKey(session.userId), session.sessionId);
  }

  async findByUserIdAndSessionId(userId: string, sessionId: string): Promise<Session | null> {
    const key = this.getSessionKey(userId, sessionId);
    const data = await this.redis.get(key);
    if (!data) return null;
    const obj = JSON.parse(data);
    return Object.assign(new Session('', '', '', '', '', '', '', new Date(), new Date()), obj);
  }

  async remove(userId: string, sessionId: string): Promise<void> {
    const key = this.getSessionKey(userId, sessionId);
    await this.redis.del(key);
    await this.redis.srem(this.getUserSessionsKey(userId), sessionId);
  }

  async revoke(userId: string, sessionId: string): Promise<void> {
    const session = await this.findByUserIdAndSessionId(userId, sessionId);
    if (!session) return;
    session.revoke();
    await this.save(session);
    await this.redis.srem(this.getUserSessionsKey(userId), sessionId);
  }

  async revokeAll(userId: string): Promise<void> {
    const sessions = await this.findAllActiveByUserId(userId);
    for (const session of sessions) {
      session.revoke();
      await this.save(session);
      await this.redis.srem(this.getUserSessionsKey(userId), session.sessionId);
    }
  }

  async findAllActiveByUserId(userId: string): Promise<Session[]> {
    const setKey = this.getUserSessionsKey(userId);
    const sessionIds = await this.redis.smembers(setKey);
    if (!sessionIds.length) return [];
    const pipeline = this.redis.pipeline();
    sessionIds.forEach(sid => pipeline.get(this.getSessionKey(userId, sid)));
    const results = await pipeline.exec();
    const sessions: Session[] = [];
    results.forEach(([err, data]) => {
      if (!err && data) {
        const obj = JSON.parse(data);
        if (obj.status === 'active') {
          sessions.push(Object.assign(new Session('', '', '', '', '', '', '', new Date(), new Date()), obj));
        }
      }
    });
    return sessions;
  }
}
