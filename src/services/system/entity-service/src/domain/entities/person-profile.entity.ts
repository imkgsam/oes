export interface PersonProfileProps {
  id: string
  entityId: string
  gender?: string | null
  birthday?: Date | null
  idNumber?: string | null
  passportNumber?: string | null
  createdAt: Date
  updatedAt: Date
}

export class PersonProfile {
  private readonly props: PersonProfileProps

  constructor(props: PersonProfileProps) {
    this.props = props
  }

  get id(): string {
    return this.props.id
  }

  get entityId(): string {
    return this.props.entityId
  }

  get gender(): string | null | undefined {
    return this.props.gender
  }

  get birthday(): Date | null | undefined {
    return this.props.birthday
  }

  get idNumber(): string | null | undefined {
    return this.props.idNumber
  }

  get passportNumber(): string | null | undefined {
    return this.props.passportNumber
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  toJSON(): PersonProfileProps {
    return { ...this.props }
  }

  static create(props: PersonProfileProps): PersonProfile {
    return new PersonProfile(props)
  }
}
