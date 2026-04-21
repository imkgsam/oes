import { ICommand } from '@nestjs/cqrs'
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class UpdateNavigationEntryCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly entryKey: string

  @IsOptional()
  @IsString()
  readonly name?: string

  @IsOptional()
  @IsString()
  readonly description?: string | null

  @IsOptional()
  @IsString()
  readonly featureKey?: string | null

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly supportedTerminals?: string[]

  @IsOptional()
  @IsInt()
  readonly registryPriority?: number

  @IsOptional()
  @IsBoolean()
  readonly enabled?: boolean

  @IsOptional()
  @IsString()
  readonly entryType?: string

  constructor(params: {
    entryKey: string
    name?: string
    description?: string | null
    featureKey?: string | null
    supportedTerminals?: string[]
    registryPriority?: number
    enabled?: boolean
    entryType?: string
  }) {
    this.entryKey = params.entryKey
    this.name = params.name
    this.description = params.description
    this.featureKey = params.featureKey
    this.supportedTerminals = params.supportedTerminals
    this.registryPriority = params.registryPriority
    this.enabled = params.enabled
    this.entryType = params.entryType
  }
}
