# Repo Symbol Alignment 历史

更新时间：2026-03-24 13:40:00 +08:00

## 本次范围

- 参考 `permission-service` 的 `REPO` symbol 风格
- 统一 `auth-service` 当前活跃 repository 注入 token

## 修改内容

- 新增：
  - `src/common/constants/symbols/repo.symbols.ts`
  - `src/common/constants/symbols/index.ts`
- 活跃 repository 注入已统一切换到：
  - `REPO.LOGIN_METHOD`
  - `REPO.MFA_BINDING`
  - `REPO.OTP`
  - `REPO.OTP_SEND_THROTTLE`
  - `REPO.LOGIN_RISK`
  - `REPO.SESSION`

## 结果

- 旧字符串 repository token 已从 `auth-service/src` 活跃代码中退出
- `USER_REPOSITORY` 错误命名已不再参与活跃运行链路
- 当前仅保留 `HASHING_SERVICE` 等非 repository token 在 `injection-tokens.ts`

## 验证

- `pnpm --filter auth-service build`
