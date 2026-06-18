/** SiteDomainError reports site-service domain invariant violations without transport concerns. */
export class SiteDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SiteDomainError'
  }
}
