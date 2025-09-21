import { LoginMethod } from '../aggregates/loginmethod.aggregate'

export interface ILoginMethodRepository {
  // ==================== 查询方法 ====================

  /**
   * 根据 ID 查找登录方法
   * @param id 登录方法 ID
   * @returns Promise<LoginMethod | null>
   */
  findById(id: string): Promise<LoginMethod | null>

  /**
   * 查找所有登录方法
   * @returns Promise<LoginMethod[]>
   */
  findAll(): Promise<LoginMethod[]>

  /**
   * 根据类型和标识符查找登录方法
   * @param type 登录类型
   * @param identifier 标识符（邮箱、手机号等）
   * @returns Promise<LoginMethod | null>
   */
  findByTypeAndIdentifier(type: string, identifier: string): Promise<LoginMethod | null>

  /**
   * 根据用户 ID 和类型查找登录方法
   * @param userId 用户 ID
   * @param type 登录类型
   * @returns Promise<LoginMethod | null>
   */
  findByUserIdAndType(userId: string, type: string): Promise<LoginMethod | null>

  // ==================== 保存方法 ====================

  /**
   * 保存登录方法（创建或更新）
   *
   * 推荐使用此方法，配合领域实体：
   * ```typescript
   * const loginMethod = LoginMethod.fromPrisma(prismaData)
   * loginMethod.verify()
   * await repo.save(loginMethod)
   * ```
   *
   * @param loginMethod 登录方法实体
   * @returns Promise<LoginMethod>
   */
  save(loginMethod: LoginMethod): Promise<LoginMethod>
}
