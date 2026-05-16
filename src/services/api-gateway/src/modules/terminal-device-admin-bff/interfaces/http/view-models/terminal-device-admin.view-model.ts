import { ApiProperty } from '@nestjs/swagger'

// Provides a flexible Swagger marker for Admin Terminal Device BFF responses.
export class TerminalDeviceAdminObjectViewModel {
  @ApiProperty({ type: Object })
  data!: Record<string, unknown>
}
