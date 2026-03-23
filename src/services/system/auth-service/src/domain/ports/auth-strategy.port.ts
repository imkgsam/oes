export interface AuthStrategyPort<T = unknown> {
  getType(): string
  authenticate(dto: T): Promise<string>
}
