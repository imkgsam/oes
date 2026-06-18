import { BadRequestException } from '@nestjs/common'
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface'

export const EMPLOYEE_OFFICIAL_PHOTO_MAX_BYTES = 2 * 1024 * 1024
export const EMPLOYEE_OFFICIAL_PHOTO_ALLOWED_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp'
]

export const EMPLOYEE_OFFICIAL_PHOTO_UPLOAD_LIMITS = {
  fileSize: EMPLOYEE_OFFICIAL_PHOTO_MAX_BYTES
} as const

// employeeOfficialPhotoFileFilter rejects unsupported official photo MIME types before downstream orchestration runs.
export function employeeOfficialPhotoFileFilter(
  _request: unknown,
  file: { mimetype?: string },
  callback: (error: Error | null, acceptFile: boolean) => void
): void {
  const contentType = file.mimetype?.trim().toLowerCase()
  if (contentType && EMPLOYEE_OFFICIAL_PHOTO_ALLOWED_MIME_TYPES.includes(contentType)) {
    callback(null, true)
    return
  }

  callback(new BadRequestException('employee official photo must be image/jpeg, image/png, or image/webp'), false)
}

export const EMPLOYEE_OFFICIAL_PHOTO_UPLOAD_OPTIONS: MulterOptions = {
  fileFilter: employeeOfficialPhotoFileFilter,
  limits: EMPLOYEE_OFFICIAL_PHOTO_UPLOAD_LIMITS
}
