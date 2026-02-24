import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { HttpClientOptions } from './http.types'
import { InfrastructureException } from '../../core/exceptions/oes.exception'
import {
  EXTERNAL_HTTP_TIMEOUT,
  EXTERNAL_HTTP_UNAVAILABLE,
  EXTERNAL_HTTP_ERROR
} from '../../core/exceptions/exception-enums/infrastructure-exception.enum'

export class HttpClient {
  private readonly client: AxiosInstance
  private readonly maxRetries: number

  constructor(options: HttpClientOptions) {
    this.maxRetries = options.retries ?? 2

    this.client = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeout ?? 5000,
      headers: options.headers
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // OTel instrumentation-http 自动注入 traceparent，无需手动处理
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => this.handleError(error)
    )
  }

  private async handleError(error: AxiosError): Promise<AxiosResponse> {
    if (this.isRetryable(error)) {
      return this.retryWithBackoff(error)
    }
    throw this.wrapError(error)
  }

  /** 仅网络错误和 5xx 可重试 */
  private isRetryable(error: AxiosError): boolean {
    if (!error.response) return true
    return error.response.status >= 500
  }

  private async retryWithBackoff(error: AxiosError): Promise<AxiosResponse> {
    let lastError = error
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      await this.delay(2 ** attempt * 200)
      try {
        return await this.client.request(error.config!)
      } catch (e) {
        lastError = e as AxiosError
        if (!this.isRetryable(lastError)) break
      }
    }
    throw this.wrapError(lastError)
  }

  /** AxiosError → InfrastructureException */
  private wrapError(error: AxiosError): InfrastructureException {
    const detail = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new InfrastructureException(EXTERNAL_HTTP_TIMEOUT, detail)
    }
    if (!error.response || error.response.status >= 500) {
      return new InfrastructureException(EXTERNAL_HTTP_UNAVAILABLE, detail)
    }
    return new InfrastructureException(EXTERNAL_HTTP_ERROR, detail)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
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
