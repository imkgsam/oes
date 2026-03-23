

> 测试阶段使用的是jaeger all-in-one, 实际部署需要更完整的系统链


# 一、完整方案与迁移思路
## 1️⃣ 架构分层

OES + OpenTelemetry + 后端存储 + 可视化

 ┌───────────────┐        ┌───────────────┐
 │  OES Gateway  │        │                         OES Service  │
 │                                    │        │  (子模块)     │
 │  OTEL SDK                  │        │  OTEL SDK     │
 └───────┬───────┘        └───────┬───────┘
         │                                                  │
         │ outbound gRPC/HTTP/TCP │
         ▼                        ▼
 ┌─────────────────────────────────────────┐
 │      OTEL Collector (可选生产)         │
 └─────────────────────────────────────────┘
         │
         ▼
 ┌─────────────┐      ┌───────────────┐
 │ Trace DB    │      │ Metrics DB    │
 │ Jaeger/Tempo│      │ Prometheus    │
 └─────────────┘      └───────────────┘
         │
         ▼
 ┌─────────────┐
 │ Grafana UI  │
 └─────────────┘


### 核心概念

- **OTEL SDK**：嵌入每个服务进程，负责生成 trace/span/metrics
    
- **Collector**：生产环境可选，做数据聚合、采样、批量发送
    
- **Backend**：存储和查询 trace/metrics/logs
    
- **Visualization**：Grafana/Jaeger UI，便于查看 trace、调用链和性能指标
    

---

## 2️⃣ 数据流说明（一次请求例子）

假设调用链：`client → gateway → auth-service → permission-service`

1. Gateway 收到请求 → SDK 创建 **root span**
    
2. Gateway 调用子模块 → SDK 创建 **child span**，header 注入 traceparent
    
3. 子模块收到请求 → SDK 创建 child span，自动继承父 trace
    
4. 子模块处理异常/timeout → SDK 自动标记 span.error
    
5. 调用完成 → SDK 发送 span 数据到 Jaeger All-in-One 或 Collector
    
6. UI 查询 → 可以看到完整 trace 链，包含每一层耗时和异常信息
    

> ✅ 业务代码（guard / interceptor / filter）无需关心 traceId / spanId

---

## 3️⃣ Exception / Warning 处理

- **Exception**：由 guard/controller/service 抛出 → Filter 转换成协议异常 → SDK 自动记录 span.error
    
- **Warning**：通过 payload/meta 返回 → SDK 记录属性，但不标记 span.error
    
- **超时 / 调用失败**：SDK 自动记录 span status 为 error
    
- **好处**：整个调用链的失败/异常/警告都可以通过 trace 查看
    

---

## 4️⃣ 迁移到生产级系统要考虑的点

|阶段|组件|说明|
|---|---|---|
|阶段 1（当前）|Jaeger All-in-One|仅验证 trace，短期存储，单节点|
|阶段 2|Collector + 单节点 Tempo / Jaeger Cluster|支持多服务，采样率可调，长期存储|
|阶段 3|Collector Cluster + 分布式 Tempo/Jaeger + Prometheus + Loki + Grafana|高 QPS，横向扩展，可追踪全链路，指标和日志联动，支持告警|

---

# 二、Jaeger All-in-One 部署步骤（落地可执行）

## 1️⃣ 准备环境

- Docker 或 Docker Compose
    
- Node.js / NestJS 服务
    

---

## 2️⃣ 拉取 Jaeger All-in-One 镜像

`docker pull jaegertracing/all-in-one:1.54`

---

## 3️⃣ 启动 All-in-One 容器（最简单方式）

`docker run -d \   --name jaeger \   -e COLLECTOR_ZIPKIN_HTTP_PORT=9411 \   -p 16686:16686 \  # UI   -p 4318:4318 \    # OTLP HTTP   -p 14250:14250 \  # gRPC collector   jaegertracing/all-in-one:1.54`

### 端口说明

|端口|用途|
|---|---|
|16686|Web UI 查询|
|4318|OTLP HTTP 接收|
|14250|OTLP gRPC 接收|
|9411|Zipkin 兼容（可选）|

> ⚠️ 注意：本地测试阶段端口映射即可，生产环境不用用 16686 暴露到公网

---

## 4️⃣ NestJS 服务配置 OTEL SDK

### 安装依赖

`npm install @opentelemetry/sdk-node \   @opentelemetry/auto-instrumentations-node \   @opentelemetry/exporter-trace-otlp-http`

---

### `src/otel.ts`

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'oes-gateway',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'
  }),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start()
  .then(() => console.log('OpenTelemetry SDK started'))
  .catch(console.error);

process.on('SIGTERM', async () => {
  await sdk.shutdown();
});


---

### 5️⃣ 在 `main.ts` 最前面引入

import './otel';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();


> ✅ **关键点**：OTel 初始化必须在 NestFactory 之前

---

## 6️⃣ 验证

1. 打开 UI：http://localhost:16686
    
2. 调用你的 Gateway / 子模块接口
    
3. 查看 trace：
    
    - 服务名（gateway、auth、permission）
        
    - span 层级
        
    - 异常/错误标记
        
    - 耗时
        

---

## 7️⃣ 补充说明

- **全局 trace**：不需要你手动生成 traceId / spanId
    
- **异常/警告**：SDK 会自动标记 error，warning 依然走 payload/meta
    
- **多协议支持**：OTel SDK 支持 HTTP / gRPC / TCP（通过 auto-instrumentation 或手动打 span）
    
- **迁移到生产**：只需替换 All-in-One 为 Collector + 分布式 Backend + Grafana/Loki/Prometheus 即可
    

---

💡 **总结**

- **开发阶段**：Jaeger All-in-One + SDK → 快速验证 trace
    
- **生产阶段**：Collector + Tempo / Jaeger Cluster + Grafana / Prometheus / Loki → 高可用、可扩展、长期存储
    
- **业务代码**无需修改，trace / span / error 自动记录