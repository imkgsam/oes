

export const ROLES = {
  REGULAR_USER: {
    code: 'regular_user',
    description: '系统普通用户',
    module: 'SYSTEM',
    isSystem: true,
    autoGrant: true,
    enabled: true
  },
  SYS_ADMIN: {
    code: 'sys_admin',
    description: '系统管理员',
    module: 'SYSTEM',
    isSystem: true,
    autoGrant: false,
    enabled: true
  }
}


// code        String   @unique
// description String?
// module      String
// isSystem    Boolean  @default(false) // 是否为系统内置角色
// autoGrant   Boolean  @default(false) // 是否新用户自动赋予
// enabled     Boolean  @default(true) // 是否启用
// createdAt   DateTime @default(now())
// updatedAt   DateTime @updatedAt