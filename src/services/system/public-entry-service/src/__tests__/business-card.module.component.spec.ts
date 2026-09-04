import 'reflect-metadata'
import { BusinessCardApplicationService } from '../application/services/business-card-application.service'
import { ShortLinkTargetResolverRegistry } from '../application/services/short-link-target-resolver.registry'
import { BusinessCardResolverRegistration } from '../modules/business-card/business-card.module'

// Verifies the BusinessCard resolver registration provider can receive Nest constructor injection.
describe('BusinessCardModule providers', () => {
  it('declares injectable constructor metadata for resolver registration', () => {
    expect(Reflect.getMetadata('design:paramtypes', BusinessCardResolverRegistration)).toEqual([
      ShortLinkTargetResolverRegistry,
      BusinessCardApplicationService
    ])
  })
})
