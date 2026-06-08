import {
  BusinessCardContactAssetPort,
  BusinessCardEmployeePort,
  BusinessCardTenantProfilePort
} from '../../application/ports/business-card.ports'

// UnavailableBusinessCardEmployeeAdapter marks missing HR/Identity integration as an explicit upstream boundary.
export class UnavailableBusinessCardEmployeeAdapter implements BusinessCardEmployeePort {
  getEmployeeSummary(): Promise<null> {
    return Promise.resolve(null)
  }

  getEmployeeByAccount(): Promise<null> {
    return Promise.resolve(null)
  }
}

// UnavailableBusinessCardContactAssetAdapter hides Contact Actions until identity-service integration is wired.
export class UnavailableBusinessCardContactAssetAdapter implements BusinessCardContactAssetPort {
  resolvePublicSafeValues(): Promise<[]> {
    return Promise.resolve([])
  }
}

// UnavailableBusinessCardTenantProfileAdapter prevents public rendering from inventing tenant display truth.
export class UnavailableBusinessCardTenantProfileAdapter implements BusinessCardTenantProfilePort {
  getCompanyDisplaySummary(): Promise<null> {
    return Promise.resolve(null)
  }
}
