export enum EntityType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION'
}

export function isValidEntityType(value: string): value is EntityType {
  return Object.values(EntityType).includes(value as EntityType)
}
