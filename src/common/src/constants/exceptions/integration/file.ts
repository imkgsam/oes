import { ExceptionConst } from '../../../core/interfaces/exceptions.interface'
// 文件相关错误
// 4xxx

export const FILE_EXCEPTIONS: Record<string, ExceptionConst> = {
  FILE_UPLOAD_FAILED: {
    subCode: '4001',
    message: '文件上传失败',
    messageKey: 'system.file_upload_failed',
    httpStatus: 500
  },

  FILE_NOT_FOUND: {
    subCode: '4002',
    message: '文件未找到',
    messageKey: 'system.file_not_found',
    httpStatus: 404
  }
}
