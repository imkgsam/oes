export class ConfigChangedEvent {
  constructor(public readonly newConfig: Record<string, any>) {}
}
