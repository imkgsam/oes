# DDD 设计模式使用指南

## 概述

本项目采用领域驱动设计（DDD）模式，推荐使用领域实体配合 repository 的 `save()` 方法。

## 推荐的使用方式

### 1. MFA 绑定操作

#### ✅ 推荐方式：使用领域实体

```typescript
// 创建 TOTP 绑定
const binding = MfaBindingEntity.createTotpBinding(userId)
await this.mfaBindingRepo.save(binding)

// 创建邮箱 MFA 绑定
const binding = MfaBindingEntity.createEmailOtpBinding(userId)
await this.mfaBindingRepo.save(binding)

// 创建短信 MFA 绑定
const binding = MfaBindingEntity.createSmsOtpBinding(userId)
await this.mfaBindingRepo.save(binding)
```

### 2. OTP 操作

#### ✅ 推荐方式：使用领域实体

```typescript
// 创建 MFA OTP
const otp = OneTimeToken.createMfaOtp({
  type: OTP_TYPES.EMAIL,
  identifier: email,
  code: this.generateEmailCode(),
  expiredAt: new Date(Date.now() + 5 * 60 * 1000),
})
await this.oneTimeTokenRepo.save(otp)
```

### 3. 登录方法操作

#### ✅ 推荐方式：使用领域实体

```typescript
// 查找并更新登录方法
const loginMethod = await this.loginMethodRepo.findByTypeAndIdentifier('EMAIL', email)
if (loginMethod) {
  loginMethod.verify() // 使用领域实体的业务方法
  await this.loginMethodRepo.save(loginMethod)
}
```

## 领域实体的业务方法

### MfaBindingEntity

```typescript
// 创建不同类型的绑定
static createTotpBinding(userId: string): MfaBindingEntity
static createEmailOtpBinding(userId: string): MfaBindingEntity
static createSmsOtpBinding(userId: string): MfaBindingEntity

// 业务方法
verifyTotpBinding(inputCode: string): boolean
activateTotpBinding(): void
enable(): void
disable(): void
```

### OneTimeToken

```typescript
// 创建不同类型的 OTP
static createMfaOtp(params): OneTimeToken
static createLoginOtp(params): OneTimeToken
static createRegisterOtp(params): OneTimeToken

// 业务方法
verify(inputCode: string): boolean
verifyMfa(inputCode: string): boolean
markConsumed(): void
```

### LoginMethod

```typescript
// 业务方法
verify(): void
enable(): void
disable(): void
isVerified(): boolean
isEnabled(): boolean
```

## Repository 方法分类

### 核心方法

- `save(entity)` - 保存领域实体（创建或更新）
- `findById(id)` - 查找实体
- `findAll()` - 查找所有实体
- 其他查询方法

### 业务操作方法

- `markUsed(id)` - 标记 OTP 为已使用（OTP Repository）
- `delete(id)` - 删除实体（MFA Binding Repository）

## 设计原则

### 1. 业务逻辑封装在实体中

```typescript
// ✅ 好的做法
const binding = MfaBindingEntity.createTotpBinding(userId)
const isValid = binding.verifyTotpBinding(inputCode)
if (isValid) {
  binding.activateTotpBinding()
  await repo.save(binding)
}
```

### 2. 使用领域实体的工厂方法

```typescript
// ✅ 使用工厂方法
const binding = MfaBindingEntity.createTotpBinding(userId)
const otp = OneTimeToken.createMfaOtp({...})
```

### 3. 通过实体方法修改状态

```typescript
// ✅ 使用实体方法
loginMethod.verify()
binding.activateTotpBinding()
otp.markConsumed()
```

## 测试场景

在测试中，可以直接使用领域实体的工厂方法：

```typescript
// 测试场景：使用领域实体创建测试数据
const testBinding = MfaBindingEntity.createTotpBinding('test-user')
await mfaBindingRepo.save(testBinding)

const testOtp = OneTimeToken.createMfaOtp({
  type: OTP_TYPES.EMAIL,
  identifier: 'test@example.com',
  code: '123456',
  expiredAt: new Date(Date.now() + 5 * 60 * 1000),
})
await oneTimeTokenRepo.save(testOtp)
```

## 总结

- **推荐**：使用领域实体 + `save()` 方法
- **原则**：业务逻辑封装在实体中，repository 只负责数据持久化
- **简化**：移除了多余的 `create()` 和 `update()` 方法，专注于 DDD 模式
