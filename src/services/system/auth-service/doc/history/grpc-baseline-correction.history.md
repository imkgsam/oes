# gRPC Baseline Correction

## Goal

纠正 `auth-service` 的对外暴露形态，使其与 `permission-service` 一致，回到 gRPC 接口方向。

## Changes

- `main.ts` 从 `Transport.TCP` 切换为 `Transport.GRPC`
- `modules/auth/auth.module.ts` 移除 `interfaces/tcp` 控制器装配
- 删除 `src/interfaces/tcp/controllers/*`
- 新增 `interfaces/grpc/auth.grpc.controller.ts` 作为当前最小 gRPC 控制器骨架
- 新增 `common/constants/exception-enums/`，对齐 `permission-service` 的异常定义结构
- 旧的 `common/constants/exceptions/auth-service.exceptions.ts` 改为 `OUTDATE` 兼容层

## Notes

- 当前只承接现有 `auth.proto` 中的 `LoginWithEmailPassword`
- `interfaces/tcp` 属于错误方向残留，应在后续人工审核后彻底删除
- gRPC 协议当前仍明显落后于设计文档，这一刀未扩协议
