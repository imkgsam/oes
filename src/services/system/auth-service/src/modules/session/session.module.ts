import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CommonJwtModule } from '@oes/common/auth'
import { SessionService } from 'src/application/services/session.service'
import { RedisUserSessionRepository } from 'src/infrastructure/repositories/redis/session/redis-user-session.repository'
import { SESSION_REPOSITORY } from 'src/common/constants/injection-tokens'

/**
 * Session 妯″潡
 *
 * 鍔熻兘锛氭彁渚?Session 绠＄悊鐩稿叧鐨勬湇鍔″拰渚濊禆娉ㄥ叆
 *
 * 浣跨敤鍦烘櫙锛? * - 鐢ㄦ埛浼氳瘽绠＄悊
 * - 鍙屼护鐗屾満鍒? * - 绠＄悊鍛樻帶鍒跺姛鑳? * - 璁惧绾у埆绠＄悊
 * - 瀹夊叏瀹¤鍜岀洃鎺? *
 * 鎶€鏈壒鐐癸細
 * - 闆嗘垚 CommonJwtModule 杩涜浠ょ墝澶勭悊
 * - 浣跨敤 ConfigModule 杩涜閰嶇疆绠＄悊
 * - 缁戝畾 RedisSessionRepository 瀹炵幇
 * - 鏀寔渚濊禆娉ㄥ叆鍜屾ā鍧楀寲
 *
 * 鏋舵瀯浣嶇疆锛氭ā鍧楀眰锛圡odules Layer锛? * - 鐙珛鐨勪笟鍔℃ā鍧楃粍缁? * - 渚夸簬妯″潡鍖栧紑鍙戝拰缁存姢
 * - 鏀寔妯″潡闂寸殑娓呮櫚杈圭晫
 */
@Module({
  imports: [ConfigModule, CommonJwtModule],
  providers: [
    SessionService,
    {
      provide: SESSION_REPOSITORY,
      useClass: RedisUserSessionRepository
    }
  ],
  exports: [SessionService, SESSION_REPOSITORY]
})
export class SessionModule {}
