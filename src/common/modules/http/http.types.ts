export interface HttpClientOptions {
  baseURL: string
  timeout?: number
  retries?: number
  headers?: Record<string, string>
}
