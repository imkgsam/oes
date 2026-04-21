import { IQuery } from '@nestjs/cqrs'
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator'

export class ResolveNavigationPreviewQuery implements IQuery {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly roleIds: string[]

  @IsString()
  @IsNotEmpty()
  readonly scopeLevel: string

  @IsString()
  @IsNotEmpty()
  readonly terminal: string

  constructor(params: { roleIds: string[]; scopeLevel: string; terminal: string }) {
    this.roleIds = params.roleIds
    this.scopeLevel = params.scopeLevel
    this.terminal = params.terminal
  }
}
