import 'reflect-metadata'
import { BusinessCardApplicationService } from '../../src/application/services/business-card-application.service'
import { ShortLinkTargetResolverRegistry } from '../../src/application/services/short-link-target-resolver.registry'
import { BusinessCardResolverRegistration } from '../../src/modules/business-card/business-card.module'

// Verifies the BusinessCard resolver registration provider can receive Nest constructor injection.
describe('BusinessCardModule providers', () => {
  it('declares injectable constructor metadata for resolver registration', () => {
    expect(Reflect.getMetadata('design:paramtypes', BusinessCardResolverRegistration)).toEqual([
      ShortLinkTargetResolverRegistry,
      BusinessCardApplicationService
    ])
  })
})
