import { IQuery } from '@nestjs/cqrs'
import { Allow, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

export class ListRoleTemplatesQuery implements IQuery {
  @IsInt()
  @Min(1)
  readonly page: number

  @IsInt()
  @Min(1)
  readonly pageSize: number

  @IsOptional()
  @IsString()
  readonly keyword?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(params: { page: number; pageSize: number; keyword?: string; operatorScope?: OperatorScope }) {
    this.page = params.page
    this.pageSize = params.pageSize
    this.keyword = params.keyword
    this.operatorScope = params.operatorScope
  }
}
