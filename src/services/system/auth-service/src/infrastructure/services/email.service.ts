import { Injectable } from '@nestjs/common'

@Injectable()
export class EmailService {
  // 开发测试阶段的硬编码验证码
  private readonly DEV_EMAIL_CODE = '123456'

  /**
   * 发送邮箱验证码
   *
   * 开发测试阶段：返回硬编码验证码
   * 生产环境：发送实际邮件
   *
   * @param email 邮箱地址
   * @param code 验证码
   * @returns Promise<string> 返回验证码（开发阶段返回硬编码，生产阶段返回实际验证码）
   */
  async sendEmailVerificationCode(email: string, code: string): Promise<string> {
    // 开发测试阶段：使用硬编码验证码
    if (this.isDevelopmentMode()) {
      console.log(`[开发模式] 邮箱验证码已发送到 ${email}`)
      console.log(`[开发模式] 验证码: ${this.DEV_EMAIL_CODE}`)
      return this.DEV_EMAIL_CODE
    }

    // TODO: 生产环境实现邮件发送逻辑
    // 这里应该集成实际的邮件服务，如 SendGrid、AWS SES 等
    console.log(`发送验证码 ${code} 到邮箱 ${email}`)

    // 示例实现：
    // await this.mailerService.sendMail({
    //   to: email,
    //   subject: '邮箱验证码',
    //   template: 'email-verification',
    //   context: { code }
    // })

    return code
  }

  /**
   * 发送 MFA 绑定确认邮件
   * @param email 邮箱地址
   */
  async sendMfaBindingConfirmation(email: string): Promise<void> {
    // TODO: 实现 MFA 绑定确认邮件
    console.log(`发送 MFA 绑定确认邮件到 ${email}`)
  }

  /**
   * 检查是否为开发模式
   * @returns boolean
   */
  private isDevelopmentMode(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
  }

  /**
   * 获取开发模式的硬编码验证码
   * @returns string
   */
  getDevEmailCode(): string {
    return this.DEV_EMAIL_CODE
  }
}
