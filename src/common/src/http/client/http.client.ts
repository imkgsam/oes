import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { HttpClientOptions } from './http.types'
import { getTraceId } from '../../../modules/tracing/trace-context'

export class HttpClient {
  private client: AxiosInstance
  private retries: number

  constructor(options: HttpClientOptions) {
    this.retries = options.retries ?? 2

    this.client = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeout ?? 5000,
      headers: options.headers
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    //请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 从 trace context 中获取 trace-id，保持链路追踪
        const traceId = getTraceId()
        if (traceId) {
          config.headers['x-trace-id'] = traceId
        }
        return config
      },
      (error) => Promise.reject(error)
    )
    //响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        let retries = this.retries
        while (retries > 0) {
          retries--
          try {
            return await this.client.request(error.config)
          } catch (e) {
            if (retries <= 0) throw e
          }
        }
        throw error
      }
    )
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const resp: AxiosResponse<T> = await this.client.get(url, config)
    return resp.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const resp: AxiosResponse<T> = await this.client.post(url, data, config)
    return resp.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const resp: AxiosResponse<T> = await this.client.put(url, data, config)
    return resp.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const resp: AxiosResponse<T> = await this.client.delete(url, config)
    return resp.data
  }
}
