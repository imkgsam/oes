import { EntityType } from '../value-objects'

export interface EntityProps {
  id: string
  type: EntityType
  name: string
  alias?: string | null
  isActive: boolean
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export class Entity {
  private readonly props: EntityProps

  constructor(props: EntityProps) {
    this.props = props
  }

  get id(): string {
    return this.props.id
  }

  get type(): EntityType {
    return this.props.type
  }

  get name(): string {
    return this.props.name
  }

  get alias(): string | null | undefined {
    return this.props.alias
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  get notes(): string | null | undefined {
    return this.props.notes
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  isPerson(): boolean {
    return this.props.type === EntityType.PERSON
  }

  isOrganization(): boolean {
    return this.props.type === EntityType.ORGANIZATION
  }

  toJSON(): EntityProps {
    return { ...this.props }
  }

  static create(props: EntityProps): Entity {
    return new Entity(props)
  }
}
