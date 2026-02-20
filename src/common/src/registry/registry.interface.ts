export interface ServiceRegistry {
  register(): Promise<void>
  deregister(): Promise<void>
}
