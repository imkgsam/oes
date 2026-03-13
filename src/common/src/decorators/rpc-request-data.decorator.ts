import { Payload } from '@nestjs/microservices'

export const RpcRequestData = (): ParameterDecorator => Payload()
