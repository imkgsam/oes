import { Injectable } from '@nestjs/common'

@Injectable()
export class SmsService {
  // 开发测试阶段的硬编码验证码
  private readonly DEV_SMS_CODE = '654321'

  /**
   * 发送手机验证码
   *
   * 开发测试阶段：返回硬编码验证码
   * 生产环境：发送实际短信
   *
   * @param phone 手机号
   * @param code 验证码
   * @returns Promise<string> 返回验证码（开发阶段返回硬编码，生产阶段返回实际验证码）
   */
  async sendPhoneVerificationCode(
    phone: string,
    code: string
  ): Promise<string> {
    // 开发测试阶段：使用硬编码验证码
    if (this.isDevelopmentMode()) {
      console.log(`[开发模式] 短信验证码已发送到 ${phone}`)
      console.log(`[开发模式] 验证码: ${this.DEV_SMS_CODE}`)
      return this.DEV_SMS_CODE
    }

    // TODO: 生产环境实现短信发送逻辑
    // 这里应该集成实际的短信服务，如 Twilio、阿里云短信等
    console.log(`发送验证码 ${code} 到手机号 ${phone}`)

    // 示例实现：
    // await this.twilioService.messages.create({
    //   body: `您的验证码是：${code}，5分钟内有效`,
    //   to: phone,
    //   from: this.configService.get('TWILIO_PHONE_NUMBER')
    // })

    return code
  }

  /**
   * 发送 MFA 绑定确认短信
   * @param phone 手机号
   */
  async sendMfaBindingConfirmation(phone: string): Promise<void> {
    // TODO: 实现 MFA 绑定确认短信
    console.log(`发送 MFA 绑定确认短信到 ${phone}`)
  }

  /**
   * 检查是否为开发模式
   * @returns boolean
   */
  private isDevelopmentMode(): boolean {
    return (
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
    )
  }

  /**
   * 获取开发模式的硬编码验证码
   * @returns string
   */
  getDevSmsCode(): string {
    return this.DEV_SMS_CODE
  }
}
