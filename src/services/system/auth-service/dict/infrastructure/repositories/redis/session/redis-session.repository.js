"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisSessionRepository = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const session_entity_1 = require("../../../../domain/entities/session.entity");
class RedisSessionRepository {
    redis;
    constructor() {
        this.redis = new ioredis_1.default({ host: 'localhost', port: 6379 });
    }
    getSessionKey(userId, sessionId) {
        return `session:${userId}:${sessionId}`;
    }
    getUserSessionsKey(userId) {
        return `sessions:${userId}`;
    }
    async save(session) {
        const key = this.getSessionKey(session.userId, session.sessionId);
        await this.redis.set(key, JSON.stringify(session), 'EX', 60 * 60 * 24 * 7);
        await this.redis.sadd(this.getUserSessionsKey(session.userId), session.sessionId);
    }
    async findByUserIdAndSessionId(userId, sessionId) {
        const key = this.getSessionKey(userId, sessionId);
        const data = await this.redis.get(key);
        if (!data)
            return null;
        const obj = JSON.parse(data);
        return Object.assign(new session_entity_1.Session('', '', '', '', '', '', '', new Date(), new Date()), obj);
    }
    async remove(userId, sessionId) {
        const key = this.getSessionKey(userId, sessionId);
        await this.redis.del(key);
        await this.redis.srem(this.getUserSessionsKey(userId), sessionId);
    }
    async revoke(userId, sessionId) {
        const session = await this.findByUserIdAndSessionId(userId, sessionId);
        if (!session)
            return;
        session.revoke();
        await this.save(session);
        await this.redis.srem(this.getUserSessionsKey(userId), sessionId);
    }
    async revokeAll(userId) {
        const sessions = await this.findAllActiveByUserId(userId);
        for (const session of sessions) {
            session.revoke();
            await this.save(session);
            await this.redis.srem(this.getUserSessionsKey(userId), session.sessionId);
        }
    }
    async findAllActiveByUserId(userId) {
        const setKey = this.getUserSessionsKey(userId);
        const sessionIds = await this.redis.smembers(setKey);
        if (!sessionIds.length)
            return [];
        const pipeline = this.redis.pipeline();
        sessionIds.forEach(sid => pipeline.get(this.getSessionKey(userId, sid)));
        const results = await pipeline.exec();
        if (!results)
            return [];
        const sessions = [];
        results.forEach(([err, data]) => {
            if (!err && data) {
                const obj = JSON.parse(data.toString());
                if (obj.status === 'active') {
                    sessions.push(Object.assign(new session_entity_1.Session('', '', '', '', '', '', '', new Date(), new Date()), obj));
                }
            }
        });
        return sessions;
    }
}
exports.RedisSessionRepository = RedisSessionRepository;
//# sourceMappingURL=redis-session.repository.js.map