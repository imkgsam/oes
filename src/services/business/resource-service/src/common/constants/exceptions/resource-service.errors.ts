import { RawError } from '../../../../../../../common/src/core/interfaces/exceptions.interface'

/**
 * 资源服务错误码定义
 *
 * 错误码分类：
 * - 0100-0199: 域名管理业务错误 (CODE_ERRORS - 不中断操作)
 * - 0200-0299: DNS记录业务错误 (CODE_ERRORS - 不中断操作)
 * - 0300-0399: 域名验证业务错误 (CODE_ERRORS - 不中断操作)
 * - 0400-0499: 权限验证错误 (EXCEPTION_ERRORS - 中断操作)
 * - 0500-0599: 业务操作错误 (EXCEPTION_ERRORS - 中断操作)
 */

// ==================== Code-based Errors (RawError) ====================
// 这些错误不会中断当前操作，而是作为warning在操作结束后返回给调用方

export const RESOURCE_SERVICE_CODE_ERRORS: Record<string, RawError> = {
  // ==================== 域名管理业务错误 (0100-0199) ====================

  /**
   * 域名已存在
   * 使用场景：创建域名时发现域名已存在，但不中断操作，返回提示信息
   */
  DOMAIN_ALREADY_EXISTS: {
    subCode: '0100',
    message: '域名已存在',
    messageKey: 'domain.already_exists'
  },

  /**
   * 域名已验证
   * 使用场景：重复验证已验证的域名，返回提示但不中断操作
   */
  DOMAIN_ALREADY_VERIFIED: {
    subCode: '0101',
    message: '域名已验证',
    messageKey: 'domain.already_verified'
  },

  /**
   * 域名未验证
   * 使用场景：未验证域名尝试某些操作，返回提示但不中断
   */
  DOMAIN_NOT_VERIFIED: {
    subCode: '0102',
    message: '域名未验证',
    messageKey: 'domain.not_verified'
  },

  // ==================== DNS记录业务错误 (0200-0299) ====================

  /**
   * DNS记录已存在
   * 使用场景：创建DNS记录时发现记录已存在，返回提示但不中断
   */
  DNS_RECORD_ALREADY_EXISTS: {
    subCode: '0200',
    message: 'DNS记录已存在',
    messageKey: 'dns_record.already_exists'
  },

  /**
   * 必需记录不能删除
   * 使用场景：尝试删除必需记录，返回提示但不中断操作
   */
  DNS_RECORD_REQUIRED_CANNOT_DELETE: {
    subCode: '0201',
    message: '必需记录不能删除',
    messageKey: 'dns_record.required_cannot_delete'
  },

  /**
   * 记录类型不支持
   * 使用场景：使用不支持的DNS记录类型，返回提示但不中断
   */
  DNS_RECORD_TYPE_NOT_SUPPORTED: {
    subCode: '0202',
    message: '记录类型不支持',
    messageKey: 'dns_record.type_not_supported'
  },

  // ==================== 域名验证业务错误 (0300-0399) ====================

  /**
   * 验证方法不支持
   * 使用场景：使用不支持的验证方法，返回提示但不中断
   */
  VERIFICATION_METHOD_NOT_SUPPORTED: {
    subCode: '0300',
    message: '验证方法不支持',
    messageKey: 'verification.method_not_supported'
  },

  /**
   * 验证挑战过期
   * 使用场景：验证挑战超过有效期，返回提示但不中断
   */
  VERIFICATION_CHALLENGE_EXPIRED: {
    subCode: '0301',
    message: '验证挑战过期',
    messageKey: 'verification.challenge_expired'
  },

  /**
   * 验证重试次数超限
   * 使用场景：验证失败次数超过限制，返回提示但不中断
   */
  VERIFICATION_RETRY_LIMIT_EXCEEDED: {
    subCode: '0302',
    message: '验证重试次数超限',
    messageKey: 'verification.retry_limit_exceeded'
  },

  /**
   * DNS查询失败
   * 使用场景：DNS服务器无响应，返回提示但不中断操作
   */
  DNS_QUERY_FAILED: {
    subCode: '0303',
    message: 'DNS查询失败',
    messageKey: 'verification.dns_query_failed'
  }
}

// ==================== Exception-based Errors (RawError) ====================
// 这些错误会中断当前操作并透传给最顶层调用方

export const RESOURCE_SERVICE_EXCEPTION_ERRORS: Record<string, RawError> = {
  // ==================== 权限验证错误 (0400-0499) ====================

  /**
   * 租户权限不足
   * 使用场景：租户无权访问指定资源，必须中断操作
   */
  INSUFFICIENT_TENANT_PERMISSION: {
    subCode: '0400',
    message: '租户权限不足',
    messageKey: 'permission.insufficient_tenant_permission',
    httpStatus: 403
  },

  /**
   * 操作权限不足
   * 使用场景：用户无权执行指定操作，必须中断操作
   */
  INSUFFICIENT_OPERATION_PERMISSION: {
    subCode: '0401',
    message: '操作权限不足',
    messageKey: 'permission.insufficient_operation_permission',
    httpStatus: 403
  },

  /**
   * 资源访问被拒绝
   * 使用场景：资源访问权限不足，必须中断操作
   */
  RESOURCE_ACCESS_DENIED: {
    subCode: '0402',
    message: '资源访问被拒绝',
    messageKey: 'permission.resource_access_denied',
    httpStatus: 403
  },

  // ==================== 业务操作错误 (0500-0599) ====================

  /**
   * 域名不存在
   * 使用场景：查找域名时不存在，必须中断操作
   */
  DOMAIN_NOT_FOUND: {
    subCode: '0500',
    message: '域名不存在',
    messageKey: 'domain.not_found',
    httpStatus: 404
  },

  /**
   * DNS记录不存在
   * 使用场景：查找DNS记录时不存在，必须中断操作
   */
  DNS_RECORD_NOT_FOUND: {
    subCode: '0501',
    message: 'DNS记录不存在',
    messageKey: 'dns_record.not_found',
    httpStatus: 404
  },

  /**
   * 域名格式无效
   * 使用场景：域名格式不符合RFC标准，必须中断操作
   */
  DOMAIN_INVALID_FORMAT: {
    subCode: '0502',
    message: '域名格式无效',
    messageKey: 'domain.invalid_format',
    httpStatus: 400
  },

  /**
   * DNS记录格式无效
   * 使用场景：记录值格式不符合DNS标准，必须中断操作
   */
  DNS_RECORD_INVALID_FORMAT: {
    subCode: '0503',
    message: 'DNS记录格式无效',
    messageKey: 'dns_record.invalid_format',
    httpStatus: 400
  },

  /**
   * 操作冲突
   * 使用场景：并发操作冲突或资源状态冲突，必须中断操作
   */
  OPERATION_CONFLICT: {
    subCode: '0504',
    message: '操作冲突',
    messageKey: 'operation.conflict',
    httpStatus: 409
  },

  /**
   * 操作不支持
   * 使用场景：当前状态不支持该操作，必须中断操作
   */
  OPERATION_NOT_SUPPORTED: {
    subCode: '0505',
    message: '操作不支持',
    messageKey: 'operation.not_supported',
    httpStatus: 400
  },

  /**
   * 请求参数无效
   * 使用场景：请求参数缺失或格式错误，必须中断操作
   */
  INVALID_REQUEST_PARAMETERS: {
    subCode: '0506',
    message: '请求参数无效',
    messageKey: 'request.invalid_parameters',
    httpStatus: 400
  }
}

// ==================== 兼容性导出 ====================
// 为了保持向后兼容，合并所有错误到一个对象中

export const RESOURCE_SERVICE_ERRORS: Record<string, RawError> = {
  ...RESOURCE_SERVICE_CODE_ERRORS,
  ...RESOURCE_SERVICE_EXCEPTION_ERRORS
}
