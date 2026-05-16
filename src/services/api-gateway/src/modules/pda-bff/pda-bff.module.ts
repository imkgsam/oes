import { Module } from '@nestjs/common'
import { AuthBffModule } from '../auth-bff/auth-bff.module'
import { PdaDeviceHeartbeatUseCase } from './application/use-cases/pda-device-heartbeat.use-case'
import { PdaDeviceLogsUseCase } from './application/use-cases/pda-device-logs.use-case'
import { PdaSessionBootstrapUseCase } from './application/use-cases/pda-session-bootstrap.use-case'
import { InMemoryPdaDeviceDiagnosticLogStore } from './infrastructure/in-memory-pda-device-diagnostic-log.store'
import { InMemoryPdaDeviceHeartbeatStore } from './infrastructure/in-memory-pda-device-heartbeat.store'
import { PdaDeviceController } from './interfaces/http/controllers/pda-device.controller'
import { PdaSessionController } from './interfaces/http/controllers/pda-session.controller'

@Module({
  imports: [AuthBffModule],
  controllers: [PdaSessionController, PdaDeviceController],
  providers: [
    PdaSessionBootstrapUseCase,
    PdaDeviceHeartbeatUseCase,
    PdaDeviceLogsUseCase,
    InMemoryPdaDeviceDiagnosticLogStore,
    InMemoryPdaDeviceHeartbeatStore
  ]
})
// Wires the PDA-specific BFF surface while reusing existing auth/session application services.
export class PdaBffModule {}
