export interface OrganizationProfileProps {
  id: string
  entityId: string
  legalName?: string | null
  registrationNumber?: string | null
  taxId?: string | null
  country?: string | null
  website?: string | null
  createdAt: Date
  updatedAt: Date
}

export class OrganizationProfile {
  private readonly props: OrganizationProfileProps

  constructor(props: OrganizationProfileProps) {
    this.props = props
  }

  get id(): string {
    return this.props.id
  }

  get entityId(): string {
    return this.props.entityId
  }

  get legalName(): string | null | undefined {
    return this.props.legalName
  }

  get registrationNumber(): string | null | undefined {
    return this.props.registrationNumber
  }

  get taxId(): string | null | undefined {
    return this.props.taxId
  }

  get country(): string | null | undefined {
    return this.props.country
  }

  get website(): string | null | undefined {
    return this.props.website
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  toJSON(): OrganizationProfileProps {
    return { ...this.props }
  }

  static create(props: OrganizationProfileProps): OrganizationProfile {
    return new OrganizationProfile(props)
  }
}
