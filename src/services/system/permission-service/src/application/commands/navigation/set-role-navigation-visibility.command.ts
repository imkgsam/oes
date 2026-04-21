import { ICommand } from '@nestjs/cqrs'
import { IsArray, IsBoolean, IsNotEmpty, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

/** RoleNavigationVisibilityInputCommand carries one role visibility update. */
export class RoleNavigationVisibilityInputCommand {
  @IsString()
  @IsNotEmpty()
  readonly entryKey!: string

  @IsString()
  @IsNotEmpty()
  readonly terminal!: string

  @IsBoolean()
  readonly enabled!: boolean
}

/** SetRoleNavigationVisibilityCommand replaces a role's managed visible entries. */
export class SetRoleNavigationVisibilityCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly roleId: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleNavigationVisibilityInputCommand)
  readonly visibility: RoleNavigationVisibilityInputCommand[]

  constructor(params: { roleId: string; visibility: RoleNavigationVisibilityInputCommand[] }) {
    this.roleId = params.roleId
    this.visibility = params.visibility
  }
}
