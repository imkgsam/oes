import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

// Defines the payload for creating a global permission dictionary item.
export class CreatePermissionDto {
  @ApiProperty({
    description: 'Stable global permission code.',
    example: 'permission.create'
  })
  @IsString()
  @IsNotEmpty()
  code: string

  @ApiProperty({
    description: 'Owning service or module name.',
    example: 'PERMISSION_SERVICE'
  })
  @IsString()
  @IsNotEmpty()
  module: string

  @ApiPropertyOptional({
    description: 'Human-readable permission description.'
  })
  @IsOptional()
  @IsString()
  description?: string
}
