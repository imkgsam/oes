// File: src/common/core/filters/otel-exception.filter.ts

import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common'
import { SpanStatusCode, trace } from '@opentelemetry/api'

@Catch()
export class OtelExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // 获取当前 Span（由 OTel 自动创建）
    const activeSpan = trace.getActiveSpan()

    if (activeSpan) {
      if (exception instanceof Error) activeSpan.recordException(exception)
      else if (typeof exception === 'string') activeSpan.recordException(new Error(exception))
      else activeSpan.recordException(new Error(JSON.stringify(exception)))
      activeSpan.setStatus({ code: SpanStatusCode.ERROR })
    }

    // 继续交给 后续exception Filter 处理
    throw exception
  }
}
