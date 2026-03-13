import { IQuery } from '@nestjs/cqrs'
import { IsEnum, IsNotEmpty } from 'class-validator'
import { PermissionModule } from '../../../domain/enums/permission-module.enum'

export class ListPermissionsByModuleQuery implements IQuery {
  @IsEnum(PermissionModule, { message: 'Invalid permission module' })
  @IsNotEmpty({ message: 'Module is required' })
  readonly module: PermissionModule

  constructor(module: PermissionModule) {
    this.module = module
  }
}
