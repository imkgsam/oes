import { ApiProperty } from '@nestjs/swagger'
import { PdaBootstrapDevicePolicyViewModel } from './pda-bootstrap.view-model'

// Confirms that the PDA heartbeat was accepted and returns the current Phase 1 device policy.
export class PdaHeartbeatViewModel {
  @ApiProperty()
  accepted!: boolean

  @ApiProperty()
  deviceStatus!: 'ACTIVE'

  @ApiProperty({ type: PdaBootstrapDevicePolicyViewModel })
  devicePolicy!: PdaBootstrapDevicePolicyViewModel

  @ApiProperty()
  serverTime!: string
}

// Confirms that the PDA manual diagnostic upload was accepted by the BFF.
export class PdaDeviceLogsViewModel {
  @ApiProperty()
  accepted!: boolean

  @ApiProperty()
  receivedCount!: number

  @ApiProperty()
  serverTime!: string
}
