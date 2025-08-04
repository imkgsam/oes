# MFA 服务开发模式说明

## 概述

在开发测试阶段，MFA 服务使用硬编码的验证码，避免依赖实际的邮件和短信服务。

## 硬编码验证码

### 邮箱验证码

- **验证码**: `123456`
- **使用场景**: 所有邮箱相关的 MFA 验证

### 短信验证码

- **验证码**: `654321`
- **使用场景**: 所有手机相关的 MFA 验证

## 开发模式检测

系统通过 `NODE_ENV` 环境变量检测是否为开发模式：

- `development` - 开发环境
- `test` - 测试环境
- 其他值 - 生产环境

## 使用示例

### 1. 邮箱 MFA 绑定流程

```typescript
// 1. 开始邮箱 MFA 绑定
const result = await mfaService.startEmailMfaBinding(userId, 'user@example.com')

if (result.needsEmailVerification) {
  console.log('需要验证邮箱，验证码已发送')
  console.log('开发模式验证码: 123456')

  // 2. 验证邮箱验证码
  const verifyResult = await mfaService.verifyEmailCode(
    result.otpTokenId,
    '123456', // 使用硬编码验证码
  )

  if (verifyResult.success) {
    console.log('邮箱 MFA 绑定成功')
  }
}
```

### 2. 手机 MFA 绑定流程

```typescript
// 1. 开始手机 MFA 绑定
const result = await mfaService.startSmsMfaBinding(userId, '+8613800138000')

if (result.needsPhoneVerification) {
  console.log('需要验证手机号，验证码已发送')
  console.log('开发模式验证码: 654321')

  // 2. 验证手机验证码
  const verifyResult = await mfaService.verifySmsCode(
    result.otpTokenId,
    '654321', // 使用硬编码验证码
  )

  if (verifyResult.success) {
    console.log('手机 MFA 绑定成功')
  }
}
```

### 3. 生成 MFA 令牌

```typescript
// 生成一次性令牌
const token = await mfaService.generateOneTimeToken(userId)

// 根据类型验证
switch (token.type) {
  case MfaType.EMAIL_OTP:
    console.log('邮箱验证码已发送')
    console.log('开发模式验证码: 123456')
    break

  case MfaType.SMS_OTP:
    console.log('短信验证码已发送')
    console.log('开发模式验证码: 654321')
    break

  case MfaType.TOTP:
    console.log('请在 TOTP 应用中输入验证码')
    break
}

// 验证用户输入的代码
const verifiedUserId = await mfaService.verifyMfaCode(token.tokenId, '123456')
```

## 控制台输出

在开发模式下，系统会在控制台输出验证码信息：

```
[开发模式] 邮箱验证码已发送到 user@example.com
[开发模式] 验证码: 123456

[开发模式] 短信验证码已发送到 +8613800138000
[开发模式] 验证码: 654321
```

## 生产环境

在生产环境中，系统会：

1. 生成随机的 6 位数字验证码
2. 调用实际的邮件/短信服务发送验证码
3. 不会在控制台输出验证码信息

## 注意事项

1. **仅用于开发测试**：硬编码验证码仅用于开发和测试环境
2. **安全风险**：在生产环境中使用硬编码验证码存在安全风险
3. **环境变量**：确保正确设置 `NODE_ENV` 环境变量
4. **日志记录**：开发模式下的验证码会记录在日志中，注意日志安全

## 切换到生产模式

要切换到生产模式，需要：

1. 设置环境变量：`NODE_ENV=production`
2. 实现实际的邮件服务（如 SendGrid、AWS SES）
3. 实现实际的短信服务（如 Twilio、阿里云短信）
4. 移除硬编码验证码相关代码
