import { Inject } from '@nestjs/common'
import { ServiceKey } from './service-map'

export const InjectServiceClient = (serviceKey: ServiceKey): ParameterDecorator =>
  Inject(serviceKey)
