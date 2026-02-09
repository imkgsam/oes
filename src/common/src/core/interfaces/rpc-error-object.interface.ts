export interface RpcErrorObject {
  code?: number         // grpc status code
  message?: string     // 
  details?: {
    code?: string
    service?: string
    [key: string]: unknown
  }
}
