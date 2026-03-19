import { ICommand } from '@nestjs/cqrs'
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { PermissionModule } from '../../../domain/enums/permission-module.enum'

export class UpdatePermissionCommand implements ICommand {
  @IsUUID('4', { message: 'Invalid permission ID format' })
  @IsNotEmpty({ message: 'Permission ID is required' })
  readonly id: string

  @IsEnum(PermissionModule, { message: 'Invalid permission module' })
  @IsNotEmpty({ message: 'Permission module is required' })
  readonly module: PermissionModule

  @IsOptional()
  @IsString()
  readonly description?: string

  constructor(params: { id: string; module: PermissionModule; description?: string }) {
    this.id = params.id
    this.module = params.module
    this.description = params.description
  }
}
