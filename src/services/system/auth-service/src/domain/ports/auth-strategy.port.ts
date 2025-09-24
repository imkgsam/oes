export interface AuthStrategyPort<T=any> {
  getType(): string
  authenticate(dto: T): Promise<any> //Q： auth 之后返回的是什么 ？
}
