import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

// Defines the editable current-account profile fields exposed by the personal-center patch endpoint.
export class AccountProfileDto {
  @ApiPropertyOptional({
    description: 'Optional account avatar reference stored as the current account profile image.',
    maxLength: 2048,
    example: 'https://cdn.example.com/avatar/account-1.png'
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatar?: string

  @ApiPropertyOptional({
    description: 'Optional current-account display name shown in the shell and personal center.',
    maxLength: 64,
    example: '陈双鹏'
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string

  @ApiPropertyOptional({
    description: 'Optional short bio describing the current account profile.',
    maxLength: 280,
    example: '负责美隆陶瓷的外贸协同与重点客户经营。'
  })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string
}
