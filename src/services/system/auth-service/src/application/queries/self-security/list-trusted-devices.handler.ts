import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TrustedDeviceRecord } from '../../../domain/repositories/trusted-device.repository'
import { TrustedDeviceService } from '../../services/trusted-device.service'
import { ListTrustedDevicesQuery } from './list-trusted-devices.query'

@QueryHandler(ListTrustedDevicesQuery)
// Returns the active trusted-device records for one scope-aware self-service session.
export class ListTrustedDevicesHandler
  implements IQueryHandler<ListTrustedDevicesQuery, TrustedDeviceRecord[]>
{
  constructor(private readonly trustedDeviceService: TrustedDeviceService) {}

  async execute(query: ListTrustedDevicesQuery): Promise<TrustedDeviceRecord[]> {
    return this.trustedDeviceService.listTrustedDevices({
      userId: query.userId,
      scopeLevel: query.scopeLevel,
      tenantId: query.tenantId
    })
  }
}
