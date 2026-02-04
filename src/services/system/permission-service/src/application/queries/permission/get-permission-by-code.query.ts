import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsString } from 'class-validator'

export class GetPermissionByCodeQuery implements IQuery {
  @IsString()
  @IsNotEmpty({ message: 'Permission code is required' })
  readonly code: string

  constructor(code: string) {
    this.code = code
  }
}
