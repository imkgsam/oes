import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator'
import { PermissionModule } from '../../../domain/enums/permission-module.enum'

export class CreatePermissionCommand implements ICommand {
  @IsString()
  @IsNotEmpty({ message: 'Permission code is required' })
  readonly code: string

  @IsEnum(PermissionModule, { message: 'Invalid permission module' })
  @IsNotEmpty({ message: 'Permission module is required' })
  readonly module: PermissionModule

  @IsOptional()
  @IsString()
  readonly description?: string

  constructor(code: string, module: PermissionModule, description?: string) {
    this.code = code
    this.module = module
    this.description = description
  }
}
