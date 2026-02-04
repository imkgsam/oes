import { BadRequestException } from '@nestjs/common'

export class ValidationException extends BadRequestException {
  constructor(public readonly errors: string[]) {
    super({
      statusCode: 400,
      error: 'Validation Error',
      message: errors
    })
  }
}
