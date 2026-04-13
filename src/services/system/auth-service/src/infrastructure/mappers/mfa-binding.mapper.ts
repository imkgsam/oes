import { MfaType } from '@oes/common/constants'
import {
  DeviceInfo,
  MfaBindingEntity
} from '../../domain/aggregates/mfabinding.aggregate'

type PrismaMfaBindingRecord = {
  id: string
  userId: string
  type: string
  secret: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  metadata?: string | null
  deviceInfo?: string | null
}

export class MfaBindingMapper {
  static toDomain(record: PrismaMfaBindingRecord): MfaBindingEntity {
    return new MfaBindingEntity({
      id: record.id,
      userId: record.userId,
      type: record.type as MfaType,
      secret: record.secret,
      enabled: record.enabled,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      metadata: record.metadata ? (JSON.parse(record.metadata) as Record<string, unknown>) : undefined,
      deviceInfo: record.deviceInfo ? (JSON.parse(record.deviceInfo) as DeviceInfo) : undefined
    })
  }

  static toPersistence(binding: MfaBindingEntity) {
    const props = binding.getProps()

    return {
      id: props.id,
      userId: props.userId,
      type: props.type,
      secret: props.secret,
      enabled: props.enabled,
      metadata: props.metadata ? JSON.stringify(props.metadata) : null,
      deviceInfo: props.deviceInfo ? JSON.stringify(props.deviceInfo) : null,
      createdAt: props.createdAt,
      updatedAt: new Date()
    }
  }
}
