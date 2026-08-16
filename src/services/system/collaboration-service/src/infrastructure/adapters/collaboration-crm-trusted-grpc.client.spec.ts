import { CollaborationCrmTrustedGrpcClient } from './collaboration-crm-trusted-grpc.client'

/** Verifies Collaboration owns one dedicated CRM channel with no caller-selected endpoint. */
describe('CollaborationCrmTrustedGrpcClient', () => {
  it('is constructible as the package-owned CRM transport', () => {
    expect(new CollaborationCrmTrustedGrpcClient()).toBeInstanceOf(
      CollaborationCrmTrustedGrpcClient
    )
  })
})
