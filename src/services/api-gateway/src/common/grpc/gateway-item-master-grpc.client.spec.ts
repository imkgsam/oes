import {
  ITEM_MASTER_MANAGEMENT_SERVICE_NAME,
  ITEM_MASTER_QUERY_SERVICE_NAME
} from '@oes/common/generated/item_master_service'
import { GatewayItemMasterGrpcClient } from './gateway-item-master-grpc.client'

/** Verifies Gateway's dedicated Item Master client exposes only the HUMAN query and management services. */
describe('GatewayItemMasterGrpcClient', () => {
  it('resolves both service stubs from its package-local channel', () => {
    const getService = jest.fn((name: string) => ({ name }))
    const client = new GatewayItemMasterGrpcClient()
    ;(client as any).get = () => ({ getService })

    expect(client.query()).toEqual({ name: ITEM_MASTER_QUERY_SERVICE_NAME })
    expect(client.management()).toEqual({ name: ITEM_MASTER_MANAGEMENT_SERVICE_NAME })
    expect(getService.mock.calls).toEqual([
      [ITEM_MASTER_QUERY_SERVICE_NAME],
      [ITEM_MASTER_MANAGEMENT_SERVICE_NAME]
    ])
  })
})
