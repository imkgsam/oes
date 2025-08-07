import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CommonJwtModule } from '@oes/common/modules/jwt/jwt.module'
import { SessionService } from 'src/application/services/session.service'
import { RedisSessionRepository } from 'src/infrastructure/repositories/redis/session/redis-session.repository'
import { SESSION_REPOSITORY } from 'src/common/constants/injection-tokens'

/**
 * Session 模块
 *
 * 功能：提供 Session 管理相关的服务和依赖注入
 *
 * 使用场景：
 * - 用户会话管理
 * - 双令牌机制
 * - 管理员控制功能
 * - 设备级别管理
 * - 安全审计和监控
 *
 * 技术特点：
 * - 集成 CommonJwtModule 进行令牌处理
 * - 使用 ConfigModule 进行配置管理
 * - 绑定 RedisSessionRepository 实现
 * - 支持依赖注入和模块化
 *
 * 架构位置：模块层（Modules Layer）
 * - 独立的业务模块组织
 * - 便于模块化开发和维护
 * - 支持模块间的清晰边界
 */
@Module({
  imports: [ConfigModule, CommonJwtModule],
  providers: [
    SessionService,
    {
      provide: SESSION_REPOSITORY,
      useClass: RedisSessionRepository
    }
  ],
  exports: [SessionService, SESSION_REPOSITORY]
})
export class SessionModule {}
