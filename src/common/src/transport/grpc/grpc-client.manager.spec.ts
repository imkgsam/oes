import { ClientProxyFactory } from '@nestjs/microservices'
import { AppLogger } from '../../logging'
import { GrpcClientManager } from './grpc-client.manager'
import { GrpcModuleOptions } from './grpc.interfaces'

describe('GrpcClientManager logging', () => {
  const options: GrpcModuleOptions = {
    services: {
      'item-master-service': {
        serviceName: 'item-master-service',
        protoPath: ['/tmp/item-master.proto'],
        packageName: 'item_master_service',
        url: '127.0.0.1:50058'
      }
    }
  }

  let childLogger: {
    child: jest.Mock
    debug: jest.Mock
    info: jest.Mock
    log: jest.Mock
    warn: jest.Mock
    error: jest.Mock
  }

  beforeEach(() => {
    childLogger = {
      child: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
    childLogger.child.mockReturnValue(childLogger)

    jest.spyOn(ClientProxyFactory, 'create').mockReturnValue({ getService: jest.fn() } as never)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('keeps raw downstream config and endpoint details out of info logs', async () => {
    const manager = new GrpcClientManager(childLogger as unknown as AppLogger, options)

    await manager.getClient('item-master-service')

    expect(childLogger.info).not.toHaveBeenCalledWith('config ', expect.anything())
    expect(childLogger.info).not.toHaveBeenCalledWith('endpoints ', expect.anything())
    expect(childLogger.debug).toHaveBeenCalledWith(
      'Resolved static gRPC endpoint',
      expect.objectContaining({
        details: expect.objectContaining({
          serviceName: 'item-master-service',
          url: '127.0.0.1:50058'
        })
      })
    )
  })
})
