/** NavigationEntry aggregate owns stable entry metadata without terminal-specific UI mapping. */
export class NavigationEntry {
  constructor(
    public readonly entryKey: string,
    public name: string,
    public description: string | null,
    public featureKey: string | null,
    public supportedTerminals: string[],
    public registryPriority: number,
    public enabled: boolean,
    public entryType: string
  ) {}

  updateMetadata(input: {
    name?: string
    description?: string | null
    featureKey?: string | null
    supportedTerminals?: string[]
    registryPriority?: number
    enabled?: boolean
    entryType?: string
  }): void {
    if (input.name !== undefined) this.name = input.name
    if (input.description !== undefined) this.description = input.description
    if (input.featureKey !== undefined) this.featureKey = input.featureKey
    if (input.supportedTerminals !== undefined) this.supportedTerminals = [...input.supportedTerminals]
    if (input.registryPriority !== undefined) this.registryPriority = input.registryPriority
    if (input.enabled !== undefined) this.enabled = input.enabled
    if (input.entryType !== undefined) this.entryType = input.entryType
  }

  supportsTerminal(terminal: string): boolean {
    return this.supportedTerminals.includes(terminal)
  }
}
