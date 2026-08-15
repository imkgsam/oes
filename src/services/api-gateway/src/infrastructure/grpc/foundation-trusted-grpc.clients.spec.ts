import { AUTH_TARGET_AUDIENCE } from './trusted-auth.grpc.client'
import { IDENTITY_TARGET_AUDIENCE } from './trusted-identity.grpc.client'
import { PERMISSION_TARGET_AUDIENCE } from './trusted-permission.grpc.client'
import { HR_TARGET_AUDIENCE } from './trusted-hr.grpc.client'
import { TENANTORG_TARGET_AUDIENCE } from './trusted-tenant-org.grpc.client'

/** Locks Gateway's five distinct foundation target audiences and prevents producer reuse. */
describe('Gateway foundation trusted gRPC clients', () => {
  it('owns five unique canonical audiences', () => {
    const audiences = [
      AUTH_TARGET_AUDIENCE,
      IDENTITY_TARGET_AUDIENCE,
      PERMISSION_TARGET_AUDIENCE,
      HR_TARGET_AUDIENCE,
      TENANTORG_TARGET_AUDIENCE
    ]
    expect(new Set(audiences).size).toBe(5)
    expect(audiences.every((value) => /^urn:oes:service:[a-z0-9-]+$/.test(value))).toBe(true)
  })
})
