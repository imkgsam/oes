import { ICommand } from '@nestjs/cqrs'
import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateNavigationEntryCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly entryKey: string

  @IsString()
  @IsNotEmpty()
  readonly name: string

  @IsOptional()
  @IsString()
  readonly description?: string | null

  @IsOptional()
  @IsString()
  readonly featureKey?: string | null

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  readonly supportedTerminals: string[]

  @IsInt()
  readonly registryPriority: number

  @IsBoolean()
  readonly enabled: boolean

  @IsString()
  @IsNotEmpty()
  readonly entryType: string

  constructor(params: {
    entryKey: string
    name: string
    description?: string | null
    featureKey?: string | null
    supportedTerminals: string[]
    registryPriority: number
    enabled: boolean
    entryType: string
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
