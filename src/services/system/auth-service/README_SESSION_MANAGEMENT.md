# Session 管理系统文档

## 概述

本系统采用基于 Redis 的双 token Session 管理机制，支持自动续期、管理员控制、实时踢人等高级功能。**已优化使用现有的 common/modules/jwt 和 common/configs 配置**。

## 核心特性

### 1. 双 Token 机制

- **访问令牌 (Access Token)**：短期有效，用于 API 访问
- **刷新令牌 (Refresh Token)**：长期有效，用于获取新的访问令牌

### 2. 自动续期

- 访问令牌剩余 20% 时间时自动续期
- 支持配置续期策略
- 无感知的用户体验

### 3. 管理员控制

- 撤销用户所有 Session
- 暂停/恢复用户 Session
- 精确控制特定设备
- 实时踢人下线

### 4. 设备管理

- 多设备同时登录支持
- 设备数量限制
- 设备信息追踪
- 可疑设备处理

## 架构设计

### 数据存储结构

```
Redis 键值结构：
├── session:{sessionId}                    # Session 主数据
├── access_token:{token}                   # 访问令牌索引
├── refresh_token:{token}                  # 刷新令牌索引
├── user_sessions:{userId}                 # 用户 Session 集合
├── device_sessions:{deviceId}             # 设备 Session 集合
└── ip_sessions:{ipAddress}               # IP Session 集合
```

### Session 实体结构

```typescript
interface SessionEntity {
  id: string // Session ID
  userId: string // 用户 ID
  accessToken: string // 访问令牌
  refreshToken: string // 刷新令牌
  status: SessionStatus // 状态：ACTIVE/EXPIRED/REVOKED/SUSPENDED
  deviceInfo: DeviceInfo // 设备信息
  createdAt: Date // 创建时间
  lastActiveAt: Date // 最后活跃时间
  expiresAt: Date // 访问令牌过期时间
  refreshExpiresAt: Date // 刷新令牌过期时间
  metadata?: Record<string, any> // 元数据
  // 管理员控制字段
  isAdminControlled: boolean // 是否被管理员控制
  adminRevokeReason?: string // 撤销原因
  adminRevokeAt?: Date // 撤销时间
  adminRevokeBy?: string // 撤销管理员
}
```

## 配置优化

### 使用现有配置

本系统已优化使用现有的配置系统：

#### 1. Token 配置 (`src/common/configs/token.config.ts`)

```typescript
export interface ITokenConfig {
  accessTokenValidity: number // 访问令牌有效期（秒）
  refreshTokenValidity: number // 刷新令牌有效期（秒）
  issuer: string // 令牌发行者
  audience: string // 令牌受众
}
```

#### 2. JWT 服务 (`src/common/modules/jwt/jwt.service.ts`)

```typescript
// 使用现有的 CommonJwtService
constructor(
  private readonly commonJwtService: CommonJwtService,
  private readonly configService: ConfigService,
) {
  // 自动从配置中读取令牌有效期
  this.tokenConfig = this.configService.getOrThrow<ITokenConfig>(TokenConfigName)
  this.defaultConfig.accessTokenExpiry = this.tokenConfig.accessTokenValidity || 15 * 60
  this.defaultConfig.refreshTokenExpiry = this.tokenConfig.refreshTokenValidity || 7 * 24 * 60 * 60
}
```

#### 3. 环境变量配置

```bash
# Token 配置
ACCESS_TOKEN_VALIDITY_SEC=900        # 15 分钟
REFRESH_TOKEN_VALIDITY_SEC=604800    # 7 天
TOKEN_ISSUER=your-app-name
TOKEN_AUDIENCE=your-app-users

# JWT 密钥配置
AUTH_PUBLIC_KEY_PATH=keys/public.pem
AUTH_PRIVATE_KEY_PATH=keys/private.pem
```

## 使用指南

### 1. 创建 Session

```typescript
// 创建新的 Session
const deviceInfo: DeviceInfo = {
  deviceId: 'device-123',
  deviceName: 'iPhone 14',
  userAgent: 'Mozilla/5.0...',
  ipAddress: '192.168.1.100',
  location: 'Beijing, China',
  platform: 'iOS',
  browser: 'Safari',
}

const result = await sessionService.createSession(userId, deviceInfo, {
  accessTokenExpiry: 15 * 60,        // 15 分钟
  refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 天
  maxSessionsPerUser: 5,
  enableAutoRenewal: true,
  enableDeviceTracking: true,
})

// 返回结果
{
  accessToken: 'eyJhbGciOiJIUzI1NiIs...',
  refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
  sessionId: 'session-123',
}
```

### 2. 验证访问令牌

```typescript
// 验证访问令牌
const result = await sessionService.validateAccessToken(accessToken, true)

// 返回结果
{
  userId: 'user-123',
  sessionId: 'session-123',
  renewed: true, // 是否自动续期
}
```

### 3. 刷新令牌

```typescript
// 使用刷新令牌获取新的访问令牌
const result = await sessionService.refreshTokens(refreshToken)

// 返回结果
{
  accessToken: 'eyJhbGciOiJIUzI1NiIs...',
  refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
}
```

### 4. 管理员控制

```typescript
// 撤销用户所有 Session
await sessionService.adminRevokeAllSessions(
  'user-123',
  '违规行为处理',
  'admin-456'
)

// 撤销特定 Session
await sessionService.adminRevokeSession('session-123', '可疑设备', 'admin-456')

// 暂停用户所有 Session
await sessionService.adminSuspendAllSessions(
  'user-123',
  '调查期间暂停',
  'admin-456'
)

// 恢复用户所有 Session
await sessionService.adminRestoreAllSessions('user-123')
```

### 5. 实时控制

```typescript
// 踢出用户的其他设备
await sessionService.kickOtherDevices('user-123', 'current-session-id')

// 踢出指定设备
await sessionService.kickDevice('session-123')
```

### 6. 查询和监控

```typescript
// 获取用户 Session 列表
const sessions = await sessionService.getUserSessions('user-123')

// 获取系统统计信息
const stats = await sessionService.getSessionStats()
// {
//   total: 1000,
//   active: 800,
//   expired: 150,
//   revoked: 30,
//   suspended: 20
// }

// 获取用户统计信息
const userStats = await sessionService.getUserSessionStats('user-123')
// {
//   total: 3,
//   active: 2,
//   devices: ['iPhone', 'MacBook'],
//   lastActiveAt: new Date()
// }
```

## 模块集成

### SessionModule

```typescript
@Module({
  imports: [
    ConfigModule,
    CommonJwtModule, // 使用现有的 JWT 模块
    RedisModule
  ],
  providers: [
    SessionService,
    {
      provide: ISessionRepository,
      useClass: RedisSessionRepository
    }
  ],
  exports: [SessionService, ISessionRepository]
})
export class SessionModule {}
```

### 在 AuthService 中使用

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly sessionService: SessionService,
    private readonly commonJwtService: CommonJwtService
  ) {}

  async login(credentials: LoginDto) {
    // 验证用户凭据
    const user = await this.validateUser(credentials)

    // 创建设备信息
    const deviceInfo: DeviceInfo = {
      deviceId: this.generateDeviceId(),
      deviceName: this.getDeviceName(),
      userAgent: this.getUserAgent(),
      ipAddress: this.getClientIp(),
      location: await this.getLocation(),
      platform: this.getPlatform(),
      browser: this.getBrowser()
    }

    // 创建 Session
    const session = await this.sessionService.createSession(user.id, deviceInfo)

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      sessionId: session.sessionId,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }
  }

  async validateToken(token: string) {
    return this.sessionService.validateAccessToken(token)
  }

  async refreshToken(refreshToken: string) {
    return this.sessionService.refreshTokens(refreshToken)
  }

  async logout(sessionId: string) {
    await this.sessionService.logout(sessionId)
  }
}
```

## 安全特性

### 1. 令牌安全

- JWT 签名验证（使用现有的 RS256 算法）
- 令牌轮换机制
- 短期访问令牌
- 长期刷新令牌

### 2. 设备追踪

- 设备指纹识别
- IP 地址记录
- 地理位置追踪
- 设备类型识别

### 3. 管理员控制

- 实时撤销能力
- 精确设备控制
- 批量操作支持
- 操作审计日志

### 4. 自动清理

- 过期 Session 自动清理
- 内存使用优化
- 定期维护任务
- 性能监控

## 配置选项

### Session 配置

```typescript
interface SessionConfig {
  accessTokenExpiry: number // 访问令牌过期时间（秒）
  refreshTokenExpiry: number // 刷新令牌过期时间（秒）
  maxSessionsPerUser: number // 用户最大 Session 数量
  enableAutoRenewal: boolean // 是否启用自动续期
  enableDeviceTracking: boolean // 是否启用设备追踪
}
```

### Redis 配置

```typescript
// Redis 连接配置
{
  host: 'localhost',
  port: 6379,
  password: 'your-password',
  db: 0,
  keyPrefix: 'auth:session:',
}
```

## 错误处理

### 常见错误码

| 错误码 | 消息             | 说明                     |
| ------ | ---------------- | ------------------------ |
| 0013   | Session 不存在   | Session 已被删除或不存在 |
| 0014   | Session 无效     | 令牌过期或格式错误       |
| 0015   | Session 已被撤销 | 管理员撤销或用户登出     |
| 0016   | Session 已被暂停 | 管理员暂停 Session       |
| 0017   | Session 数量超限 | 超过最大设备数量限制     |
| 0018   | 设备已被踢出     | 设备被强制下线           |
| 0019   | 刷新令牌无效     | 刷新令牌过期或无效       |
| 0020   | 访问令牌即将过期 | 提醒客户端刷新令牌       |

## 最佳实践

### 1. 客户端实现

```typescript
// 自动处理令牌刷新
class TokenManager {
  private accessToken: string
  private refreshToken: string

  async handleApiRequest(request: () => Promise<any>) {
    try {
      return await request()
    } catch (error) {
      if (error.code === '0014') {
        // Session 无效
        await this.refreshTokens()
        return await request()
      }
      throw error
    }
  }

  private async refreshTokens() {
    const result = await api.post('/auth/refresh', {
      refreshToken: this.refreshToken
    })
    this.accessToken = result.accessToken
    this.refreshToken = result.refreshToken
  }
}
```

### 2. 服务端集成

```typescript
// 在 Auth Guard 中使用
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = this.extractToken(request)

    try {
      const result = await this.sessionService.validateAccessToken(token)
      request.user = { userId: result.userId, sessionId: result.sessionId }
      return true
    } catch (error) {
      return false
    }
  }
}
```

### 3. 监控和告警

```typescript
// 定期清理过期 Session
@Cron('0 */5 * * * *') // 每5分钟执行
async cleanupExpiredSessions() {
  const deletedCount = await this.sessionRepository.deleteExpiredSessions()
  if (deletedCount > 0) {
    this.logger.log(`Cleaned up ${deletedCount} expired sessions`)
  }
}

// 监控 Session 统计
@Cron('0 0 * * * *') // 每小时执行
async monitorSessionStats() {
  const stats = await this.sessionService.getSessionStats()
  if (stats.active > 10000) {
    // 发送告警
    this.alertService.sendAlert('High session count detected')
  }
}
```

## 扩展功能

### 1. 异地登录检测

- IP 地理位置对比
- 登录时间分析
- 用户确认机制
- 风险评分系统

### 2. 跨端登录管理

- 设备类型限制
- 平台特定策略
- 设备白名单
- 自动设备分类

### 3. 审计追踪

- 详细操作日志
- 用户行为分析
- 安全事件记录
- 合规性报告

### 4. 设备/IP 绑定

- 设备指纹识别
- IP 地址绑定
- 地理位置限制
- 动态安全策略

## 性能优化

### 1. Redis 优化

- 使用 Redis Cluster 支持高并发
- 合理设置 TTL 避免内存泄漏
- 使用 Pipeline 批量操作
- 监控 Redis 性能指标

### 2. 缓存策略

- Session 数据缓存
- 用户信息缓存
- 设备信息缓存
- 统计信息缓存

### 3. 异步处理

- 异步日志记录
- 异步清理任务
- 异步监控告警
- 异步审计记录

## 部署建议

### 1. 生产环境配置

```typescript
// 生产环境 Session 配置
const productionConfig: SessionConfig = {
  accessTokenExpiry: 15 * 60, // 15 分钟
  refreshTokenExpiry: 30 * 24 * 60 * 60, // 30 天
  maxSessionsPerUser: 3, // 限制设备数量
  enableAutoRenewal: true, // 启用自动续期
  enableDeviceTracking: true // 启用设备追踪
}
```

### 2. 监控指标

- Session 创建/删除速率
- 令牌验证成功率
- 自动续期触发次数
- 管理员操作频率
- Redis 内存使用情况

### 3. 安全建议

- 定期轮换 JWT 密钥
- 监控异常登录行为
- 实施速率限制
- 启用审计日志
- 定期安全评估

## 优化总结

### 1. 配置复用

- ✅ 使用现有的 `CommonJwtService`
- ✅ 复用 `TokenConfig` 配置
- ✅ 利用现有的 JWT 密钥管理
- ✅ 统一错误处理机制

### 2. 代码简化

- ✅ 移除重复的 JWT 配置
- ✅ 简化令牌生成逻辑
- ✅ 统一配置管理
- ✅ 减少维护成本

### 3. 架构优化

- ✅ 模块化设计
- ✅ 依赖注入优化
- ✅ 配置集中管理
- ✅ 代码复用最大化
